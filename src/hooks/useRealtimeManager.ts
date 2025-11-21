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
  debounceMs = 500, // Build 26: Optimized from 1500ms to 500ms
  maxRetries = 5, // Build 32: Max reconnection attempts
  retryDelay = 5000, // Build 32: Increased to 5s base delay (less aggressive)
}: RealtimeManagerOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debouncedCallbacksRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isConnectedRef = useRef(false);
  const retryCountRef = useRef(0); // Build 28: Circuit breaker retry counter
  const circuitOpenRef = useRef(false);
  const lastErrorTimeRef = useRef(0);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ Constantes do circuit breaker
  const CIRCUIT_BREAKER_PAUSE = 600000; // 10 minutos
  const MAX_FAILURES_BEFORE_PAUSE = 5; // 5 falhas antes de pausar

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

    // ✅ Debounce setup to prevent rapid channel creation/destruction
    const setupTimeout = setTimeout(() => {
      // ✅ Circuit breaker melhorado - menos agressivo
      if (circuitOpenRef.current) {
        const timeSinceLastError = Date.now() - lastErrorTimeRef.current;
        
        if (timeSinceLastError < CIRCUIT_BREAKER_PAUSE) {
          const minutesRemaining = Math.ceil((CIRCUIT_BREAKER_PAUSE - timeSinceLastError) / 60000);
          logger.warn('RealtimeManager', `🛑 Circuit breaker OPEN - retry em ${minutesRemaining}min`);
          return;
        } else {
          logger.info('RealtimeManager', '✅ Circuit breaker RESET');
          circuitOpenRef.current = false;
          retryCountRef.current = 0;
        }
      }

      logger.info('RealtimeManager', `Initializing with ${subscriptions.length} subscriptions`);
      logger.debug('RealtimeManager', `Retry count: ${retryCountRef.current}`);

      // ✅ BUILD 32: Safety timeout increased to 20s (less aggressive)
      const safetyTimeout = setTimeout(() => {
      if (!isConnectedRef.current && channelRef.current) {
        logger.warn('RealtimeManager', 'Safety timeout reached');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }, 20000);

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
        logger.warn('RealtimeManager', '⚠️ Channel error detected');
        
        retryCountRef.current++;
        lastErrorTimeRef.current = Date.now();
        
        // ✅ Circuit breaker mais inteligente
        if (retryCountRef.current >= MAX_FAILURES_BEFORE_PAUSE) {
          circuitOpenRef.current = true;
          logger.warn('RealtimeManager', `🛑 ${MAX_FAILURES_BEFORE_PAUSE} falhas - circuit breaker OPEN por 10 min`);
          
          // ✅ Reset automático após 10 minutos
          const safetyTimeout = setTimeout(() => {
            retryCountRef.current = 0;
            circuitOpenRef.current = false;
            logger.info('RealtimeManager', '🔄 Circuit breaker AUTO-RESET');
          }, CIRCUIT_BREAKER_PAUSE);
          
          if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
          }
          safetyTimeoutRef.current = safetyTimeout;
          
          return; // ❌ NÃO tentar reconectar
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

    }, 2000);

    // Cleanup function
    return () => {
      logger.debug('RealtimeManager', 'Cleaning up subscriptions');
      clearTimeout(setupTimeout);
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
