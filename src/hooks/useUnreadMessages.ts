import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUnreadMessages = () => {
  const { user, userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !userProfile) return;

    const isStudent = userProfile.user_type === 'student';
    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(isStudent ? 'unread_count_student' : 'unread_count_teacher')
          .eq(isStudent ? 'student_id' : 'teacher_id', user.id);

        if (error) {
          console.error('Erro ao buscar mensagens não lidas:', error);
          return;
        }

        const total = data?.reduce((sum, conv: any) => {
          const count = isStudent ? conv.unread_count_student : conv.unread_count_teacher;
          return sum + (count || 0);
        }, 0) || 0;

        setUnreadCount(total);
      } catch (error) {
        console.error('Erro ao contar mensagens não lidas:', error);
      }
    };

    fetchUnreadCount();

    // Listen to changes in conversations
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `${isStudent ? 'student_id' : 'teacher_id'}=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userProfile]);

  return unreadCount;
};