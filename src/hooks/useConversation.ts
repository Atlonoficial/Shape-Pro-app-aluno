import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  student_id?: string;
  teacher_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count_student?: number;
  unread_count_teacher?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  id: string;
  conversation_id?: string;
  sender_id?: string;
  message: string;
  message_type?: string;
  sender_type?: string;
  is_read?: boolean;
  read_at?: string;
  created_at?: string;
  reply_to?: string;
  attachments?: any;
  status?: 'sending' | 'sent' | 'failed';
  local_id?: string;
}

export const useConversation = (userId?: string) => {
  const { userProfile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const localMessagesCache = useRef<ChatMessage[]>([]);
  // Set para controlar IDs únicos e evitar duplicação
  const messageIdsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Função para criar ou buscar conversação com retry
  const findOrCreateConversation = useCallback(async (retryCount = 0) => {
    if (!userId || !userProfile) return;

    try {
      setError(null);
      const isStudent = userProfile.user_type === 'student';
      
      if (isStudent) {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('teacher_id')
          .eq('user_id', userId)
          .single();

        if (studentError || !studentData?.teacher_id) {
          throw new Error('Professor não encontrado');
        }

        const conversationId = `${studentData.teacher_id}-${userId}`;
        
        // Buscar conversação existente
        let { data: existingConv, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        // Se não existir, criar nova
        if (!existingConv) {
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              id: conversationId,
              student_id: userId,
              teacher_id: studentData.teacher_id,
              is_active: true
            })
            .select()
            .single();

          if (createError) throw createError;
          existingConv = newConv;
        }

        setConversation(existingConv);
        setConnectionStatus('connected');
      } else {
        setError('Interface do professor em desenvolvimento');
      }
    } catch (err) {
      console.error(`Erro ao criar/buscar conversação (tentativa ${retryCount + 1}):`, err);
      
      if (retryCount < 3) {
        // Retry com backoff exponencial
        const delay = Math.pow(2, retryCount) * 1000;
        retryTimeoutRef.current = setTimeout(() => {
          findOrCreateConversation(retryCount + 1);
        }, delay);
        
        setReconnecting(true);
        setConnectionStatus('connecting');
      } else {
        setError(err instanceof Error ? err.message : 'Erro de conexão');
        setConnectionStatus('disconnected');
        toast.error('Erro ao conectar. Tentando reconectar...');
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false);
        setReconnecting(false);
      }
    }
  }, [userId, userProfile]);

  // Buscar mensagens em tempo real com reconexão automática
  const fetchMessages = useCallback((conversationId: string) => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Debounce para evitar processamento múltiplo
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(() => {
            console.log('Nova mensagem:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as ChatMessage;
              
              // Verificar se já processamos esta mensagem
              if (messageIdsRef.current.has(newMessage.id)) {
                console.log('Mensagem já existe, ignorando duplicação:', newMessage.id);
                return;
              }
              
              setMessages(prev => {
                // Procurar mensagem local correspondente pelo conteúdo e timestamp aproximado
                const localMsgIndex = prev.findIndex(msg => 
                  msg.status === 'sending' && 
                  msg.message === newMessage.message &&
                  msg.sender_id === newMessage.sender_id &&
                  Math.abs(new Date(msg.created_at || 0).getTime() - new Date(newMessage.created_at || 0).getTime()) < 10000 // 10 segundos de diferença
                );
                
                let updatedMessages = [...prev];
                
                // Se encontrou mensagem local correspondente, substituir
                if (localMsgIndex >= 0) {
                  updatedMessages[localMsgIndex] = { ...newMessage, status: 'sent' };
                } else {
                  // Verificar se mensagem já existe pelo ID
                  const existsById = updatedMessages.some(msg => msg.id === newMessage.id);
                  if (!existsById) {
                    updatedMessages.push({ ...newMessage, status: 'sent' });
                  }
                }
                
                // Adicionar ao set de IDs processados
                messageIdsRef.current.add(newMessage.id);
                
                // Ordenar por data de criação
                return updatedMessages.sort((a, b) => 
                  new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
                );
              });
              
              // Atualizar cache local
              localMessagesCache.current = localMessagesCache.current.map(msg => 
                msg.status === 'sending' && 
                msg.message === newMessage.message &&
                msg.sender_id === newMessage.sender_id
                  ? { ...newMessage, status: 'sent' }
                  : msg
              );
            }
          }, 100); // 100ms de debounce
        }
      )
      .subscribe((status) => {
        console.log('Canal status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
      });

    channelRef.current = channel;

    // Buscar mensagens existentes com retry
    const loadMessages = async (retryCount = 0) => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const messagesWithStatus = (data || []).map(msg => ({ 
          ...msg, 
          status: 'sent' as const 
        }));
        
        // Limpar set de IDs e adicionar mensagens existentes
        messageIdsRef.current.clear();
        messagesWithStatus.forEach(msg => messageIdsRef.current.add(msg.id));
        
        setMessages(messagesWithStatus);
        localMessagesCache.current = messagesWithStatus;
        
      } catch (error) {
        console.error(`Erro ao buscar mensagens (tentativa ${retryCount + 1}):`, error);
        
        if (retryCount < 2) {
          setTimeout(() => loadMessages(retryCount + 1), 2000);
        } else {
          toast.error('Erro ao carregar mensagens');
        }
      }
    };

    loadMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Enviar mensagem com retry e estado local
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || !userId) return;

    const localId = `local_${Date.now()}_${Math.random()}`;
    const tempMessage: ChatMessage = {
      id: localId,
      local_id: localId,
      conversation_id: conversation.id,
      sender_id: userId,
      message: content,
      message_type: 'text',
      sender_type: userProfile?.user_type || 'student',
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    // Verificar se já existe mensagem similar (evitar duplicação por múltiplos cliques)
    const existingSimilar = messages.find(msg => 
      msg.message === content && 
      msg.sender_id === userId &&
      (msg.status === 'sending' || msg.status === 'sent') &&
      Math.abs(new Date(msg.created_at || 0).getTime() - Date.now()) < 2000 // 2 segundos
    );

    if (existingSimilar) {
      console.log('Mensagem similar já existe, ignorando');
      return;
    }

    // Adicionar mensagem local imediatamente
    setMessages(prev => [...prev, tempMessage]);
    localMessagesCache.current = [...localMessagesCache.current, tempMessage];

    const sendAttempt = async (retryCount = 0) => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: userId,
            message: content,
            message_type: 'text',
            sender_type: userProfile?.user_type || 'student'
          })
          .select()
          .single();

        if (error) throw error;

        // Atualizar última mensagem da conversação
        await supabase
          .from('conversations')
          .update({
            last_message: content,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        // Não atualizar aqui - deixar o Realtime fazer isso
        // A mensagem será substituída quando chegar via Realtime

      } catch (err) {
        console.error(`Erro ao enviar mensagem (tentativa ${retryCount + 1}):`, err);
        
        if (retryCount < 2) {
          // Retry após delay
          setTimeout(() => sendAttempt(retryCount + 1), 2000);
          
          // Atualizar status para retry
          setMessages(prev => prev.map(msg => 
            msg.local_id === localId 
              ? { ...msg, status: 'sending' as const }
              : msg
          ));
        } else {
          // Marcar como falha após 3 tentativas
          setMessages(prev => prev.map(msg => 
            msg.local_id === localId 
              ? { ...msg, status: 'failed' as const }
              : msg
          ));
          
          toast.error('Falha ao enviar mensagem. Toque para tentar novamente.');
        }
      }
    };

    await sendAttempt();
  }, [conversation, userId, userProfile]);

  // Retry mensagem falhada
  const retryMessage = useCallback((localId: string) => {
    const message = messages.find(msg => msg.local_id === localId);
    if (message && message.status === 'failed') {
      // Remove a mensagem falhada e reenvia
      setMessages(prev => prev.filter(msg => msg.local_id !== localId));
      sendMessage(message.message);
    }
  }, [messages, sendMessage]);

  // Marcar como lidas
  const markAsRead = useCallback(async () => {
    if (!conversation || !userId) return;

    try {
      const isStudent = userProfile?.user_type === 'student';
      const updateField = isStudent ? 'unread_count_student' : 'unread_count_teacher';

      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversation.id);

    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  }, [conversation, userId, userProfile]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  useEffect(() => {
    if (conversation) {
      const cleanup = fetchMessages(conversation.id);
      return cleanup;
    }
  }, [conversation, fetchMessages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    conversation,
    messages,
    loading,
    error,
    reconnecting,
    connectionStatus,
    sendMessage,
    retryMessage,
    markAsRead
  };
};