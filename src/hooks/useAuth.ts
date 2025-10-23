import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';

let initCount = 0;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootComplete, setBootComplete] = useState(false);
  
  const setupRef = useRef(false);
  const loadingRef = useRef(loading);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (setupRef.current) {
      console.log('[useAuth] ⚠️ Prevented double initialization');
      return;
    }
    setupRef.current = true;
    
    initCount++;
    const initTime = Date.now();
    console.log(`[useAuth] 🔄 INIT #${initCount}:`, {
      timestamp: initTime,
      hasSupabase: typeof onAuthStateChange === 'function',
      platform: (window as any).Capacitor?.getPlatform?.() || 'web'
    });
    
    // ✅ Safety timeout de 8 segundos com logging detalhado
    const safetyTimeout = setTimeout(() => {
      if (loadingRef.current) {
        console.error('[useAuth] ⚠️ TIMEOUT after 8s:', {
          user: user?.id || 'null',
          session: !!session,
          loading: loadingRef.current,
          timestamp: Date.now(),
          elapsedMs: Date.now() - initTime
        });
        setLoading(false);
        setBootComplete(true);
      }
    }, 8000);
    
    const { data: { subscription } } = onAuthStateChange(async (user, session) => {
      clearTimeout(safetyTimeout);
      
      console.log('[useAuth] 🔥 AUTH CHANGE:', {
        event: 'auth_change',
        userId: user?.id || 'null',
        email: user?.email || 'null',
        hasSession: !!session,
        timestamp: Date.now(),
        elapsedMs: Date.now() - initTime
      });
      
      setUser(user);
      setSession(session);
      
      if (user) {
        try {
          const profileStartTime = Date.now();
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
          console.log('[useAuth] ✅ Profile loaded:', {
            userType: profile?.user_type,
            loadTimeMs: Date.now() - profileStartTime,
            totalElapsedMs: Date.now() - initTime
          });
          
          setBootComplete(true);
          console.log('[useAuth] ✅ Boot complete, realtime enabled');
        } catch (error) {
          console.error('[useAuth] ❌ Error fetching profile:', error);
          setUserProfile(null);
          setBootComplete(true);
        }
      } else {
        console.log('[useAuth] User logged out');
        setUserProfile(null);
        setBootComplete(false);
      }
      
      setLoading(false);
      console.log('[useAuth] ✅ Auth initialization complete:', {
        totalTimeMs: Date.now() - initTime
      });
    });

    return () => {
      console.log(`[useAuth] 🧹 CLEANUP #${initCount}`);
      setupRef.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); // ✅ Executar apenas no mount - SEM dependências

  // Use centralized realtime manager for profile changes
  // CRITICAL: Only enable after boot is complete to prevent initialization lockup
  useRealtimeManager({
    subscriptions: user?.id ? [{
      table: 'profiles',
      event: '*',
      filter: `id=eq.${user.id}`,
      callback: async () => {
        console.log('[useAuth] Profile updated in real-time');
        try {
          if (user?.id) {
            const updatedProfile = await getUserProfile(user.id);
            setUserProfile(updatedProfile);
          }
        } catch (error) {
          console.error('[useAuth] Error syncing profile:', error);
        }
      }
    }] : [],
    enabled: bootComplete && !!user?.id,
    channelName: 'auth-profile',
    debounceMs: 500
  });

  return {
    user,
    session,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isStudent: userProfile?.user_type === 'student',
    isTeacher: userProfile?.user_type === 'teacher'
  };
};