import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';
import { bootManager } from '@/lib/bootManager';
import { logger } from '@/lib/logger';

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
      logger.debug('useAuth', '⚠️ Setup already running, skipping duplicate');
      return;
    }
    
    setupRef.current = true;
    initCount++;
    logger.debug('useAuth', `🔄 BUILD 22: INIT #${initCount} - Waiting for boot...`, {
      timestamp: Date.now()
    });

    // ✅ BUILD 48: AGUARDAR boot completo (timeout reduzido 10s → 5s)
    (async () => {
      try {
        await bootManager.waitForBoot(5000); // 10s → 5s
        logger.info('useAuth', '✅ Boot complete, setting up auth listener');

        // ✅ BUILD 48: Reduzir safety timeout (3s → 2s)
        const safetyTimeout = setTimeout(() => {
          if (loadingRef.current) {
            logger.warn('useAuth', '⚠️ Safety timeout triggered (2s)', {
              timestamp: Date.now()
            });
            setLoading(false);
            setBootComplete(true);
          }
        }, 2000); // 3s → 2s

        const { data: { subscription } } = onAuthStateChange(async (user, session) => {
          clearTimeout(safetyTimeout);
          
          logger.debug('useAuth', '🔄 AUTH CHANGE:', {
            hasUser: !!user,
            userId: user?.id || 'null',
            hasSession: !!session,
            timestamp: Date.now()
          });
          
          setUser(user);
          setSession(session);
          
          if (user) {
            try {
              logger.debug('useAuth', '📋 Fetching profile for:', user.id);
              
              // ✅ BUILD 48: Timeout reduzido (4s → 2s)
              const profilePromise = getUserProfile(user.id);
              const timeoutPromise = new Promise<null>((resolve) => 
                setTimeout(() => {
                  logger.warn('useAuth', '⚠️ Profile fetch timeout (2s), continuing without profile');
                  resolve(null);
                }, 2000) // 4s → 2s
              );
              
              const profile = await Promise.race([profilePromise, timeoutPromise]);
              
              if (profile) {
                logger.info('useAuth', '✅ Profile loaded:', {
                  userType: profile?.user_type,
                  timestamp: Date.now()
                });
                setUserProfile(profile);
              } else {
                logger.warn('useAuth', '⚠️ Continuing without profile due to timeout');
                setUserProfile(null);
              }
              
              setBootComplete(true);
              
            } catch (error) {
              logger.error('useAuth', '❌ Profile error:', error);
              setUserProfile(null);
              setBootComplete(true);
            }
          } else {
            logger.debug('useAuth', '👤 No user, clearing profile');
            setUserProfile(null);
            setBootComplete(false);
          }
          
          // ✅ FASE 2: CRÍTICO - Sempre desligar loading
          setLoading(false);
        });

        return () => {
          logger.debug('useAuth', `🧹 CLEANUP #${initCount}`);
          clearTimeout(safetyTimeout);
          subscription.unsubscribe();
        };
        
      } catch (error) {
        logger.error('useAuth', '❌ Boot timeout:', error);
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
