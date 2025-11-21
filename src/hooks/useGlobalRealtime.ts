import { useEffect, useRef } from 'react';
import { useRealtimeManager } from './useRealtimeManager';
import { useAuth } from './useAuth';
import '@/utils/realtimeMonitor'; // ✅ BUILD 55: Import monitor (auto-inicia em DEV)

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

  // ✅ BUILD 55: Subscriptions consolidadas (8+ canais → 1 canal = 87% redução)
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
        filter: `conversation_id.like.%${user.id}%`,
        callback: (payload) => {
          if (import.meta.env.DEV) {
            console.log('📨 New chat message:', payload.new.id);
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
      
      // ✅ Conversations (consolidado de useUnreadMessages)
      {
        table: 'conversations',
        event: '*',
        filter: `student_id=eq.${user.id}`,
        callback: () => {
          window.dispatchEvent(new CustomEvent('conversations-updated'));
        }
      },
      
      // ✅ Workout activities (consolidado de useGamificationStravaIntegration)
      {
        table: 'workout_activities',
        event: 'INSERT',
        filter: `user_id=eq.${user.id}`,
        callback: (payload) => {
          window.dispatchEvent(new CustomEvent('workout-activity-created', {
            detail: payload.new
          }));
        }
      },
    ] : [],
    enabled: !!user?.id,
    channelName: 'global-app-realtime',
    debounceMs: 2000,
    maxRetries: 3,
    retryDelay: 8000,
  });
  
  // ✅ BUILD 55: Performance metrics (DEV only)
  useEffect(() => {
    if (import.meta.env.DEV && user?.id) {
      console.log('📊 [GlobalRealtime] Performance Metrics:', {
        subscriptions: 6,
        debounceMs: 2000,
        channelName: 'global-app-realtime',
        userId: user.id
      });
    }
  }, [user?.id]);
};
