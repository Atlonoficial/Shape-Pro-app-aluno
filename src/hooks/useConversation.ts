import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
}

export const useConversation = (userId?: string) => {
  const { userProfile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para criar ou buscar conversação
  const findOrCreateConversation = useCallback(async () => {
    if (!userId || !userProfile) return;

    try {
      const isStudent = userProfile.user_type === 'student';
      
      // Se for estudante, buscar o professor
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
        let { data: existingConv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

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
      } else {
        // Se for professor, listar conversações (implementar depois)
        setError('Interface do professor em desenvolvimento');
      }
    } catch (err) {
      console.error('Erro ao criar/buscar conversação:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId, userProfile]);

  // Buscar mensagens em tempo real
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
          console.log('Nova mensagem:', payload);
          
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          }
        }
      )
      .subscribe();

    // Buscar mensagens existentes
    supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao buscar mensagens:', error);
        } else {
          setMessages(data || []);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || !userId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          message: content,
          message_type: 'text',
          sender_type: userProfile?.user_type || 'student'
        });

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

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    }
  }, [conversation, userId, userProfile]);

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

  return {
    conversation,
    messages,
    loading,
    error,
    sendMessage,
    markAsRead
  };
};