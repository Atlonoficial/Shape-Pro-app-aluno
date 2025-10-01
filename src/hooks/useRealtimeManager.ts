import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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

/**
 * Centralized Realtime Subscription Manager
 * Consolidates multiple subscriptions into optimized channels
 * Implements connection pooling and intelligent debouncing
 */
export const useRealtimeManager = ({
  subscriptions,
  enabled = true,
  channelName = 'realtime-manager',
  debounceMs = 300,
}: RealtimeManagerOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debouncedCallbacksRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isConnectedRef = useRef(false);

  // Cleanup debounced callbacks
  const clearDebouncedCallbacks = useCallback(() => {
    debouncedCallbacksRef.current.forEach((timeout) => clearTimeout(timeout));
    debouncedCallbacksRef.current.clear();
  }, []);

  // Create debounced callback wrapper
  const createDebouncedCallback = useCallback(
    (key: string, callback: (payload: any) => void) => {
      return (payload: any) => {
        const existingTimeout = debouncedCallbacksRef.current.get(key);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
          callback(payload);
          debouncedCallbacksRef.current.delete(key);
        }, debounceMs);

        debouncedCallbacksRef.current.set(key, timeout);
      };
    },
    [debounceMs]
  );

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) {
      console.log('[RealtimeManager] Disabled or no subscriptions');
      return;
    }

    console.log('[RealtimeManager] 🚀 Initializing with', subscriptions.length, 'subscriptions');

    // Create unique channel for this context with timestamp to prevent conflicts
    const uniqueChannelName = `${channelName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(uniqueChannelName);

    channelRef.current = channel;

    // Subscribe to each table/event combination
    subscriptions.forEach((sub, index) => {
      const subscriptionKey = `${sub.table}-${sub.event}-${sub.filter || 'all'}-${index}`;
      const debouncedCallback = createDebouncedCallback(subscriptionKey, sub.callback);

      const config: any = {
        event: sub.event,
        schema: 'public',
        table: sub.table,
      };

      if (sub.filter) {
        config.filter = sub.filter;
      }

      console.log('[RealtimeManager] 📡 Subscribing to:', config);

      channel.on('postgres_changes', config, (payload) => {
        console.log('[RealtimeManager] 📨 Received event:', sub.table, sub.event, payload);
        debouncedCallback(payload);
      });
    });

    // Subscribe to channel with status callback
    channel.subscribe((status) => {
      console.log('[RealtimeManager] Channel status:', status);
      isConnectedRef.current = status === 'SUBSCRIBED';

      if (status === 'SUBSCRIBED') {
        console.log('[RealtimeManager] ✅ All subscriptions active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[RealtimeManager] ❌ Channel error - connection failed');
      } else if (status === 'TIMED_OUT') {
        console.error('[RealtimeManager] ⏱️ Channel timeout');
      }
    });

    // Cleanup function
    return () => {
      console.log('[RealtimeManager] 🧹 Cleaning up subscriptions');
      clearDebouncedCallbacks();
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      isConnectedRef.current = false;
    };
  }, [subscriptions, enabled, channelName, createDebouncedCallback, clearDebouncedCallbacks]);

  return {
    isConnected: isConnectedRef.current,
    channel: channelRef.current,
  };
};
