import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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
  debounceMs?: number; // Build 26: Optimized to 500ms for better responsiveness
  maxRetries?: number; // Build 28: Circuit breaker max retries
  retryDelay?: number; // Build 28: Base retry delay in ms
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
  debounceMs = 2000, // ✅ BUILD 40.3: Aumentado de 500ms → 2000ms (menos chamadas)
  maxRetries = 3, // ✅ BUILD 40.3: Reduzido de 5 → 3 (menos retries agressivos)
  retryDelay = 8000, // ✅ BUILD 40.3: Aumentado de 5s → 8s (mais conservador)
}: RealtimeManagerOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debouncedCallbacksRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isConnectedRef = useRef(false);
  const retryCountRef = useRef(0); // Build 28: Circuit breaker retry counter
  const circuitOpenRef = useRef(false); // Build 28: Circuit breaker state
  const lastErrorTimeRef = useRef<number>(0); // Build 28: Last error timestamp

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
      return;
    }

    // Build 28: Circuit Breaker - Check if circuit is open
    if (circuitOpenRef.current) {
      const timeSinceLastError = Date.now() - lastErrorTimeRef.current;
      const circuitResetTime = retryDelay * Math.pow(2, maxRetries);
      
      if (timeSinceLastError < circuitResetTime) {
        logger.warn('RealtimeManager', `Circuit breaker OPEN - retry in ${Math.ceil((circuitResetTime - timeSinceLastError) / 1000)}s`);
        return;
      } else {
        logger.info('RealtimeManager', 'Circuit breaker RESET');
        circuitOpenRef.current = false;
        retryCountRef.current = 0;
      }
    }

    logger.info('RealtimeManager', `Initializing with ${subscriptions.length} subscriptions`);
    logger.debug('RealtimeManager', `Retry count: ${retryCountRef.current}`);

    // ✅ BUILD 40.3: Safety timeout aumentado para 30s (menos agressivo)
    const safetyTimeout = setTimeout(() => {
      if (!isConnectedRef.current && channelRef.current) {
        logger.warn('RealtimeManager', 'Safety timeout reached (30s)');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }, 30000);

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

      logger.info('RealtimeManager', 'Subscribing to:', config);

      channel.on('postgres_changes', config, (payload) => {
        logger.debug('RealtimeManager', `Event received: ${sub.table}`, payload);
        debouncedCallback(payload);
      });
    });

    // Subscribe to channel with status callback
    channel.subscribe((status) => {
      logger.info('RealtimeManager', `Channel status: ${status}`);
      isConnectedRef.current = status === 'SUBSCRIBED';

      if (status === 'SUBSCRIBED') {
        logger.info('RealtimeManager', 'All subscriptions active');
        retryCountRef.current = 0;
        circuitOpenRef.current = false;
      } else if (status === 'CHANNEL_ERROR') {
        logger.warn('RealtimeManager', 'Channel error');
        
        retryCountRef.current++;
        lastErrorTimeRef.current = Date.now();
        
        if (retryCountRef.current >= maxRetries) {
          circuitOpenRef.current = true;
          logger.warn('RealtimeManager', `Circuit breaker OPENED - pausing for ${retryDelay * Math.pow(2, maxRetries) / 1000}s`);
        } else {
          const backoffDelay = retryDelay * Math.pow(2, retryCountRef.current - 1);
          logger.debug('RealtimeManager', `Will retry with ${backoffDelay}ms backoff`);
        }
      } else if (status === 'TIMED_OUT') {
        logger.warn('RealtimeManager', 'Channel timeout');
        retryCountRef.current++;
        lastErrorTimeRef.current = Date.now();
      }
    });

    // Cleanup function
    return () => {
      logger.debug('RealtimeManager', 'Cleaning up subscriptions');
      clearTimeout(safetyTimeout);
      clearDebouncedCallbacks();
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      isConnectedRef.current = false;
      // Build 28: Don't reset circuit breaker on cleanup to prevent rapid reconnections
    };
  }, [subscriptions, enabled, channelName, createDebouncedCallback, clearDebouncedCallbacks, maxRetries, retryDelay]);

  return {
    isConnected: isConnectedRef.current,
    channel: channelRef.current,
  };
};
