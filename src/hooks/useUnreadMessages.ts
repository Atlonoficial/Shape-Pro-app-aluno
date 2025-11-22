import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * ✅ BUILD 55: Otimizado para usar canal global
 * ANTES: Canal próprio 'unread-messages'
 * DEPOIS: Listener do evento 'conversations-updated' do useGlobalRealtime
 */
export const useUnreadMessages = () => {
  const { user, userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
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
  }, [user, userProfile]);

  // ✅ Fetch inicial
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // ✅ Listener para updates do canal global
  useEffect(() => {
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener('conversations-updated', handleUpdate);
    return () => window.removeEventListener('conversations-updated', handleUpdate);
  }, [fetchUnreadCount]);

  return unreadCount;
};