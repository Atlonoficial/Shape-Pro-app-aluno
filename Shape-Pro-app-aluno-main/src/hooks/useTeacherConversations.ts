import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeManager } from './useRealtimeManager';

interface TeacherConversation {
  conversation_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_active: boolean;
}

export const useTeacherConversations = () => {
  const { user, userProfile } = useAuth();
  const [conversations, setConversations] = useState<TeacherConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user || userProfile?.user_type !== 'teacher') {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_teacher_conversations', {
        teacher_id_param: user.id
      });

      if (error) {
        console.error('Erro ao buscar conversas:', error);
        setError(error.message);
        return;
      }

      setConversations(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar conversas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Usar useRealtimeManager para subscriptions consolidadas
  useRealtimeManager({
    subscriptions: user && userProfile?.user_type === 'teacher' ? [
      {
        table: 'conversations',
        event: '*',
        filter: `teacher_id=eq.${user.id}`,
        callback: () => fetchConversations(),
      },
      {
        table: 'chat_messages',
        event: '*',
        callback: () => fetchConversations(),
      }
    ] : [],
    enabled: !!user && userProfile?.user_type === 'teacher',
    channelName: 'teacher-conversations',
    debounceMs: 800,
  });

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unread_count, 0);
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('conversations')
        .update({ unread_count_teacher: 0 })
        .eq('id', conversationId)
        .eq('teacher_id', user.id);

      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao marcar conversa como lida:', error);
    }
  };

  return {
    conversations,
    loading,
    error,
    totalUnreadCount: getTotalUnreadCount(),
    markConversationAsRead
  };
};