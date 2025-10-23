import { useState, useEffect } from 'react';
import { getNotificationsByUser, Notification } from '@/lib/supabase';

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = getNotificationsByUser(userId, (notificationData) => {
      // ✅ BUILD 29: Filtrar notificações de teste/mockadas
      const realNotifications = notificationData.filter(n => 
        n.id && // Deve ter ID válido
        n.created_at && // Deve ter timestamp
        typeof n.id === 'string' && // ID deve ser string
        n.id.length > 10 // ID deve ter comprimento mínimo (UUIDs têm 36 caracteres)
      );
      
      setNotifications(realNotifications);
      setUnreadCount(realNotifications.filter(n => !n.is_read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, loading, unreadCount };
};