import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

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
  debounceMs?: number; // Otimizado para 2000ms para melhor performance
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
  debounceMs = 2000, // Otimizado de 1500ms para 2000ms (Fase 4)
}: RealtimeManagerOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debouncedCallbacksRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

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
      logger.log('[RealtimeManager] Disabled or no subscriptions');
      return;
    }

    logger.log('[RealtimeManager] 🚀 Initializing with', subscriptions.length, 'subscriptions');

    // Consolidate channels by using stable channel name (no timestamp/random)
    const channel = supabase.channel(channelName);

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

      logger.log('[RealtimeManager] 📡 Subscribing to:', config);

      channel.on('postgres_changes', config, (payload) => {
        logger.log('[RealtimeManager] 📨 Received event:', sub.table, sub.event, payload);
        debouncedCallback(payload);
      });
    });

    // Subscribe to channel with status callback and auto-reconnect
    channel.subscribe((status) => {
      logger.log('[RealtimeManager] Channel status:', status);
      isConnectedRef.current = status === 'SUBSCRIBED';

      if (status === 'SUBSCRIBED') {
        logger.log('[RealtimeManager] ✅ All subscriptions active');
        reconnectAttemptsRef.current = 0; // Reset on success
      } else if (status === 'CHANNEL_ERROR') {
        reconnectAttemptsRef.current += 1;
        
        if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
          logger.warn('[RealtimeManager] ❌ Channel error - attempt', reconnectAttemptsRef.current, 'of', MAX_RECONNECT_ATTEMPTS);
          
          setTimeout(() => {
            logger.log('[RealtimeManager] 🔄 Reconnecting after error...');
            if (channelRef.current) {
              channelRef.current.subscribe();
            }
          }, 10000);
        } else {
          logger.error('[RealtimeManager] 🚫 Max reconnect attempts reached. Continuing without realtime.');
          // ✅ Fallback graceful - não bloquear o app
          if (channelRef.current) {
            channelRef.current.unsubscribe();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
          isConnectedRef.current = false;
        }
        
      } else if (status === 'TIMED_OUT') {
        reconnectAttemptsRef.current += 1;
        
        if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
          logger.warn('[RealtimeManager] ⏱️ Channel timeout - attempt', reconnectAttemptsRef.current, 'of', MAX_RECONNECT_ATTEMPTS);
          
          setTimeout(() => {
            logger.log('[RealtimeManager] 🔄 Reconnecting after timeout...');
            if (channelRef.current) {
              channelRef.current.subscribe();
            }
          }, 8000);
        } else {
          logger.error('[RealtimeManager] 🚫 Max reconnect attempts reached. Continuing without realtime.');
          // ✅ Fallback graceful - não bloquear o app
          if (channelRef.current) {
            channelRef.current.unsubscribe();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
          isConnectedRef.current = false;
        }
      }
    });

    // Cleanup function with explicit unsubscribe
    return () => {
      logger.log('[RealtimeManager] 🧹 Cleaning up subscriptions');
      clearDebouncedCallbacks();
      
      if (channelRef.current) {
        // Explicitly unsubscribe before removing channel
        channelRef.current.unsubscribe();
        
        // Wait 100ms to ensure disconnect completes
        setTimeout(() => {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        }, 100);
      }
      
      isConnectedRef.current = false;
    };
  }, [subscriptions, enabled, channelName, createDebouncedCallback, clearDebouncedCallbacks]);

  return {
    isConnected: isConnectedRef.current,
    channel: channelRef.current,
  };
};
