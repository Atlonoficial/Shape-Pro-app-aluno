import { useEffect, useRef } from 'react';
import { useRealtimeManager } from './useRealtimeManager';
import { useAuth } from './useAuth';

/**
 * ✅ BUILD 53: Global Realtime Hook (Singleton)
 * 
 * Consolidates ALL realtime subscriptions into a SINGLE channel
 * to prevent server overload and excessive battery drain.
 * 
 * BEFORE: 30+ separate channels = 30x overhead
 * AFTER: 1 channel = 97% reduction in connections
 * 
 * Usage: Import ONLY in App.tsx
 */

let globalRealtimeInitialized = false;

export const useGlobalRealtime = () => {
  const { user } = useAuth();
  const initRef = useRef(false);
  
  useEffect(() => {
    if (initRef.current || globalRealtimeInitialized) return;
    initRef.current = true;
    globalRealtimeInitialized = true;
    
    return () => {
      initRef.current = false;
      globalRealtimeInitialized = false;
    };
  }, []);

  // ✅ Reduzir para apenas subscriptions CRÍTICAS (13 → 4 = 69% redução)
  useRealtimeManager({
    subscriptions: user?.id ? [
      // Profile (crítico - dados do usuário)
      { 
        table: 'profiles', 
        event: '*', 
        filter: `id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('profile-updated'));
        } 
      },
      
      // Chat messages (crítico - tempo real necessário)
      { 
        table: 'chat_messages', 
        event: 'INSERT', 
        callback: (payload) => {
          if (import.meta.env.DEV) {
            console.log('📨 New chat message:', payload);
          }
          window.dispatchEvent(new CustomEvent('chat-messages-updated', {
            detail: payload.new
          }));
        } 
      },
      
      // Notifications (crítico - tempo real necessário)
      { 
        table: 'notifications', 
        event: 'INSERT', 
        filter: `${user.id}=ANY(target_users)`,
        callback: (payload) => {
          window.dispatchEvent(new CustomEvent('notification-received', {
            detail: payload.new
          }));
        }
      },
      
      // User points (crítico - gamificação tempo real)
      { 
        table: 'user_points', 
        event: '*', 
        filter: `user_id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('gamification-updated'));
        } 
      },
    ] : [],
    enabled: !!user?.id,
    channelName: 'global-app-realtime',
    debounceMs: 2000, // ✅ 1s → 2s (menos carga no servidor)
    maxRetries: 3,
    retryDelay: 8000, // ✅ 8s entre retries (menos agressivo)
  });
};
