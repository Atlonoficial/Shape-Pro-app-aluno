import { useEffect, useRef } from 'react';
import { realtimeManager } from '@/lib/realtimeManager';

interface RealtimeSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

interface RealtimeManagerOptions {
  subscriptions: RealtimeSubscription[];
  enabled?: boolean;
  channelName?: string;
  debounceMs?: number;
}

export const useRealtimeManager = ({
  subscriptions,
  enabled = true,
}: RealtimeManagerOptions) => {
  const listenerIdsRef = useRef<string[]>([]);

  // Create a stable key for subscriptions to prevent infinite loops
  const subscriptionsKey = JSON.stringify(subscriptions.map(s => ({
    table: s.table,
    event: s.event,
    filter: s.filter
  })));

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) {
      return;
    }

    // Register all subscriptions
    subscriptions.forEach((sub) => {
      const id = realtimeManager.subscribe(
        sub.table,
        sub.event,
        sub.callback,
        sub.filter
      );
      listenerIdsRef.current.push(id);
    });

    // Cleanup on unmount or deps change
    return () => {
      listenerIdsRef.current.forEach((id) => {
        realtimeManager.unsubscribe(id);
      });
      listenerIdsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionsKey, enabled]);

  return {
    isConnected: true, // Managed internally by singleton
  };
};
