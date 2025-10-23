import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';
import { bootManager } from '@/lib/bootManager';

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
      console.log('[useAuth] ⚠️ Setup already running, skipping duplicate');
      return;
    }
    
    setupRef.current = true;
    initCount++;
    console.log(`[useAuth] 🔄 BUILD 22: INIT #${initCount} - Waiting for boot...`, {
      timestamp: Date.now()
    });

    // ✅ BUILD 22: AGUARDAR boot estar completo antes de configurar auth
    (async () => {
      try {
        await bootManager.waitForBoot(10000); // 10s timeout
        console.log('[useAuth] ✅ Boot complete, setting up auth listener');

        const safetyTimeout = setTimeout(() => {
          if (loadingRef.current) {
            console.error('[useAuth] ⚠️ Safety timeout triggered (8s)', {
              timestamp: Date.now()
            });
            setLoading(false);
            setBootComplete(true);
          }
        }, 8000);

        const { data: { subscription } } = onAuthStateChange(async (user, session) => {
          clearTimeout(safetyTimeout);
          
          console.log('[useAuth] 🔄 AUTH CHANGE:', {
            hasUser: !!user,
            userId: user?.id || 'null',
            hasSession: !!session,
            timestamp: Date.now()
          });
          
          setUser(user);
          setSession(session);
          
          if (user) {
            try {
              console.log('[useAuth] 📋 Fetching profile for:', user.id);
              const profile = await getUserProfile(user.id);
              console.log('[useAuth] ✅ Profile loaded:', {
                userType: profile?.user_type,
                timestamp: Date.now()
              });
              setUserProfile(profile);
              setBootComplete(true);
            } catch (error) {
              console.error('[useAuth] ❌ Profile error:', error);
              setUserProfile(null);
              setBootComplete(true);
            }
          } else {
            console.log('[useAuth] 👤 No user, clearing profile');
            setUserProfile(null);
            setBootComplete(false);
          }
          
          setLoading(false);
        });

        return () => {
          console.log(`[useAuth] 🧹 CLEANUP #${initCount}`);
          clearTimeout(safetyTimeout);
          subscription.unsubscribe();
        };
        
      } catch (error) {
        console.error('[useAuth] ❌ Boot timeout:', error);
        setLoading(false);
        setBootComplete(false);
      }
    })();

    return () => {
      setupRef.current = false;
    };
  }, []);

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
