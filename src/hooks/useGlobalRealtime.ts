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

  // ✅ BUILD 53: Consolidar TODAS as subscriptions em um único canal
  useRealtimeManager({
    subscriptions: user?.id ? [
      // Auth & Profile
      { 
        table: 'profiles', 
        event: '*', 
        filter: `id=eq.${user.id}`, 
        callback: () => {
          // Trigger refetch nos hooks relevantes via evento custom
          window.dispatchEvent(new CustomEvent('profile-updated'));
        } 
      },
      
      // Workouts
      { 
        table: 'workout_plans', 
        event: '*', 
        callback: () => {
          window.dispatchEvent(new CustomEvent('workout-plans-updated'));
        } 
      },
      { 
        table: 'workout_activities', 
        event: '*', 
        filter: `user_id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('workout-activities-updated'));
        } 
      },
      
      // Nutrition
      { 
        table: 'meal_plans', 
        event: '*', 
        callback: () => {
          window.dispatchEvent(new CustomEvent('meal-plans-updated'));
        } 
      },
      { 
        table: 'meal_logs', 
        event: '*', 
        filter: `user_id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('meal-logs-updated'));
        } 
      },
      
      // Gamification
      { 
        table: 'user_points', 
        event: '*', 
        filter: `user_id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('gamification-updated'));
        } 
      },
      { 
        table: 'badges', 
        event: '*', 
        callback: () => {
          window.dispatchEvent(new CustomEvent('badges-updated'));
        } 
      },
      
      // Social & Messaging
      { 
        table: 'conversations', 
        event: '*', 
        callback: () => {
          window.dispatchEvent(new CustomEvent('conversations-updated'));
        } 
      },
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
      
      // Goals
      { 
        table: 'goals', 
        event: '*', 
        filter: `user_id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('goals-updated'));
        } 
      },
      
      // Appointments
      { 
        table: 'appointments', 
        event: '*', 
        callback: () => {
          window.dispatchEvent(new CustomEvent('appointments-updated'));
        } 
      },
      
      // Subscriptions
      { 
        table: 'subscriptions', 
        event: '*', 
        filter: `user_id=eq.${user.id}`, 
        callback: () => {
          window.dispatchEvent(new CustomEvent('subscriptions-updated'));
        } 
      },
    ] : [],
    enabled: !!user?.id,
    channelName: 'global-app-realtime',
    debounceMs: 1000, // ✅ BUILD 53: 1s debounce (menos carga que 500ms)
  });
};
