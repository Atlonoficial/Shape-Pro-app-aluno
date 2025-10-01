import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeManager } from './useRealtimeManager';

export const useUnreadMessages = () => {
  const { user, userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user || !userProfile) return;
    
    try {
      const isStudent = userProfile.user_type === 'student';
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

  // Use centralized realtime manager
  useRealtimeManager({
    subscriptions: user && userProfile ? [{
      table: 'conversations',
      event: '*',
      filter: `${userProfile.user_type === 'student' ? 'student_id' : 'teacher_id'}=eq.${user.id}`,
      callback: () => fetchUnreadCount(),
    }] : [],
    enabled: !!user && !!userProfile,
    channelName: 'unread-messages',
    debounceMs: 500,
  });

  useEffect(() => {
    fetchUnreadCount();
  }, [user, userProfile]);

  return unreadCount;
};