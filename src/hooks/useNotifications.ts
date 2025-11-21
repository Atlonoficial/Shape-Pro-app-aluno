import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/lib/supabase';

/**
 * ✅ BUILD 55: Otimizado para usar canal global
 * ANTES: getNotificationsByUser criava canal próprio 'notification-changes'
 * DEPOIS: Query simples + listener do evento 'notification-received' do useGlobalRealtime
 */
export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .contains('target_users', [userId])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setLoading(false);
        return;
      }

      // ✅ BUILD 29: Filtrar notificações de teste/mockadas
      const realNotifications = (data || []).filter(n => 
        n.id && 
        n.created_at && 
        typeof n.id === 'string' && 
        n.id.length > 10
      ) as Notification[];
      
      setNotifications(realNotifications);
      setUnreadCount(realNotifications.filter(n => !n.is_read).length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  // ✅ Fetch inicial
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  // ✅ Listener para novas notificações do canal global
  useEffect(() => {
    const handleNewNotification = () => fetchNotifications();
    window.addEventListener('notification-received', handleNewNotification);
    return () => window.removeEventListener('notification-received', handleNewNotification);
  }, [userId]);

  return { notifications, loading, unreadCount };
};