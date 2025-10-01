import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

/**
 * Optimized hook for managing multiple Supabase realtime subscriptions
 * Consolidates subscriptions and implements debouncing to reduce load
 */
export const useOptimizedRealtime = (
  subscriptions: RealtimeSubscription[],
  enabled = true
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const debouncedCallback = useCallback((key: string, callback: () => void, delay = 300) => {
    // Clear existing timer for this key
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      debounceTimers.current.delete(key);
    }, delay);

    debounceTimers.current.set(key, timer);
  }, []);

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    console.log('[OptimizedRealtime] Setting up subscriptions:', {
      count: subscriptions.length,
      tables: subscriptions.map(s => s.table)
    });

    // Create a single channel for all subscriptions
    const channel = supabase.channel('optimized-realtime-channel');

    // Add all subscriptions to the channel
    subscriptions.forEach((sub, index) => {
      const key = `${sub.table}-${sub.event}-${index}`;
      
      const config: any = {
        event: sub.event,
        schema: 'public',
        table: sub.table
      };
      
      if (sub.filter) {
        config.filter = sub.filter;
      }
      
      (channel as any).on(
        'postgres_changes',
        config,
        (payload: any) => {
          console.log(`[OptimizedRealtime] Event received:`, {
            table: sub.table,
            event: sub.event,
            key
          });

          // Debounce the callback to prevent overwhelming updates
          debouncedCallback(key, () => sub.callback(payload));
        }
      );
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('[OptimizedRealtime] Subscription status:', status);
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('[OptimizedRealtime] Cleaning up subscriptions');
      
      // Clear all debounce timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();

      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscriptions, enabled, debouncedCallback]);

  return {
    isConnected: channelRef.current !== null
  };
};
