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
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.is_read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, loading, unreadCount };
};