import { useEffect } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const PushNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuthContext();

  useEffect(() => {
    if (!messaging || !user) return;

    // Request permission and get token
    const setupPushNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BOn74blUZiy1MzCzg46gBQKoHY6vZWjm7aVWHkvfNfOmDAqrdStSYprEv0xKseH_gqQsFdsZI0jhV3k-lm3875g'
          });
          
          console.log('FCM Token:', token);
          // TODO: Send token to your server to store for the user
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      
      toast({
        title: payload.notification?.title || 'Nova notificação',
        description: payload.notification?.body || '',
      });
    });

    setupPushNotifications();

    return () => unsubscribe();
  }, [user, toast]);

  return null; // This component doesn't render anything
};