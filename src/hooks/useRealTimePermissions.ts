import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export const useRealTimePermissions = () => {
  const { user } = useAuth();
  const { refresh } = useActiveSubscription();

  // Realtime subscriptions using centralized manager
  useRealtimeManager({
    subscriptions: [
      {
        table: 'students',
        event: '*',
        filter: `user_id=eq.${user?.id}`,
        callback: (payload) => {
          console.log('📡 Students table changed:', payload);
          refresh();
        }
      },
      {
        table: 'plan_subscriptions',
        event: '*',
        filter: `student_user_id=eq.${user?.id}`,
        callback: (payload) => {
          console.log('📡 Plan subscriptions changed:', payload);
          refresh();
        }
      },
      {
        table: 'payment_transactions',
        event: 'UPDATE',
        filter: `student_id=eq.${user?.id}`,
        callback: (payload) => {
          console.log('📡 Payment transaction updated:', payload);
          if (payload.new?.status === 'paid') {
            setTimeout(() => {
              refresh();
            }, 2000);
          }
        }
      }
    ],
    enabled: !!user?.id,
    channelName: `permissions-${user?.id}`,
    debounceMs: 2000
  });

  return null;
};