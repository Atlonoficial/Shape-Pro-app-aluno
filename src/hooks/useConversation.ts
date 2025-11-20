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
  delivered_at?: string;
}

export const useConversation = (userId?: string) => {
  const { userProfile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const localMessagesCache = useRef<ChatMessage[]>([]);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const processedPayloadsRef = useRef<Set<string>>(new Set());

  // Função para criar ou buscar conversação com retry
  const findOrCreateConversation = useCallback(async (retryCount = 0) => {
    if (!userId || !userProfile) return;

    try {
      setError(null);
      
      // Verificar se usuário existe na tabela students (validação correta)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', userId)
        .single();

      // Se não encontrou na tabela students ou não tem teacher_id
      if (studentError || !studentData?.teacher_id) {
        setError('Você precisa estar vinculado a um professor para usar o chat');
        setConnectionStatus('disconnected');
        setLoading(false);
        return;
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

  // Buscar mensagens existentes
  const loadMessages = useCallback(async (conversationId: string) => {
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
      
      messageIdsRef.current.clear();
      messagesWithStatus.forEach(msg => messageIdsRef.current.add(msg.id));
      
      setMessages(messagesWithStatus);
      localMessagesCache.current = messagesWithStatus;
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  }, []);

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

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
    if (!conversation?.id) return;
    
    try {
      const { error } = await supabase.rpc('mark_conversation_messages_as_read', {
        p_conversation_id: conversation.id,
        p_user_id: userId
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversation?.id, userId]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!conversation?.id) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .neq('sender_id', userId);
      
      if (error) throw error;
      
      // Atualizar estado local das mensagens
      setMessages(prev => prev.map(msg => 
        msg.id === messageId && msg.sender_id !== userId 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [conversation?.id, userId]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  useEffect(() => {
    if (conversation?.id) {
      loadMessages(conversation.id);
    }
  }, [conversation?.id, loadMessages]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Listen for real-time chat message updates
  useEffect(() => {
    const handleChatUpdate = () => {
      if (conversation?.id) {
        loadMessages(conversation.id);
      }
    };

    window.addEventListener('chat-messages-updated', handleChatUpdate);
    return () => window.removeEventListener('chat-messages-updated', handleChatUpdate);
  }, [conversation?.id, loadMessages]);

  return {
    conversation,
    messages,
    loading,
    error,
    reconnecting,
    connectionStatus,
    sendMessage,
    retryMessage,
    markAsRead,
    markMessageAsRead
  };
};