import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';
import { bootManager } from '@/lib/bootManager';
import { logger } from '@/lib/logger';

let authStateChangeCount = 0;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    // ✅ BUILD 50: GUARD ABSOLUTO - Usar flag global para prevenir múltiplas execuções
    if ((window as any).__useAuthInitialized) {
      logger.warn('useAuth', '⚠️ BLOCKED: Already initialized globally');
      return;
    }
    
    (window as any).__useAuthInitialized = true;
    logger.info('useAuth', '🔄 BUILD 50: Single initialization starting');

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        await bootManager.waitForBoot(5000);
        logger.info('useAuth', '✅ Boot complete, setting up auth listener');

        // ✅ BUILD 50: Safety timeout aumentado para 3s
        const safetyTimer = setTimeout(() => {
          logger.warn('useAuth', '⏰ Safety timeout (3s), forcing ready');
          setLoading(false);
          setBootComplete(true);
        }, 3000);

        const { data: { subscription } } = onAuthStateChange(async (user, session) => {
          clearTimeout(safetyTimer);
          authStateChangeCount++;
          
          logger.info('useAuth', `🔔 AUTH STATE CHANGE #${authStateChangeCount}`, {
            hasUser: !!user,
            userId: user?.id || 'null',
            hasSession: !!session,
            timestamp: Date.now()
          });
          
          setUser(user);
          setSession(session);
          
          if (user) {
            try {
              logger.info('useAuth', '📋 Fetching profile for:', user.id);
              
              // ✅ BUILD 50: Timeout agressivo (1s)
              const profilePromise = getUserProfile(user.id);
              const timeoutPromise = new Promise<null>((resolve) => 
                setTimeout(() => {
                  logger.warn('useAuth', '⚠️ Profile timeout (1s), skipping');
                  resolve(null);
                }, 1000)
              );
              
              const profile = await Promise.race([profilePromise, timeoutPromise]);
              
              if (profile) {
                logger.info('useAuth', '✅ Profile loaded:', {
                  userType: profile?.user_type
                });
                setUserProfile(profile);
              } else {
                logger.warn('useAuth', '⚠️ No profile, continuing');
                setUserProfile(null);
              }
              
              setBootComplete(true);
              
            } catch (error) {
              logger.error('useAuth', '❌ Profile error:', error);
              setUserProfile(null);
              setBootComplete(true);
            }
          } else {
            logger.info('useAuth', '👤 No user, clearing state');
            setUserProfile(null);
            setBootComplete(false);
          }
          
          // ✅ BUILD 50: Log detalhado antes de desligar loading
          logger.info('useAuth', `✅ About to set loading = false (event #${authStateChangeCount})`);
          setLoading(false);
          logger.info('useAuth', `✅ Loading set to false (event #${authStateChangeCount})`);
        });

        unsubscribe = () => {
          logger.info('useAuth', '🧹 Cleanup: Unsubscribing');
          clearTimeout(safetyTimer);
          subscription.unsubscribe();
        };
        
      } catch (error) {
        logger.error('useAuth', '❌ Setup error:', error);
        setLoading(false);
        setBootComplete(false);
      }
    })();

    // ✅ Cleanup apenas UMA VEZ
    return () => {
      if (unsubscribe) unsubscribe();
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
        logger.debug('useAuth', 'Profile updated in real-time');
        try {
          if (user?.id) {
            const updatedProfile = await getUserProfile(user.id);
            setUserProfile(updatedProfile);
          }
        } catch (error) {
          logger.error('useAuth', 'Error syncing profile:', error);
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
