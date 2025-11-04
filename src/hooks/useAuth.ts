import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
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
    // ✅ BUILD 51: GUARD ABSOLUTO - Usar flag global para prevenir múltiplas execuções
    if ((window as any).__useAuthInitialized) {
      logger.warn('useAuth', '⚠️ BLOCKED: Already initialized globally');
      return;
    }
    
    (window as any).__useAuthInitialized = true;
    logger.info('useAuth', '🔄 BUILD 51: Single initialization starting');

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        // ✅ BUILD 51: Timeout reduzido para 3s (5s → 3s)
        await bootManager.waitForBoot(3000);
        logger.info('useAuth', '✅ Boot complete, setting up auth listener');

        // ✅ BUILD 51: Safety timeout reduzido para 1.5s (3s → 1.5s)
        const safetyTimer = setTimeout(() => {
          logger.warn('useAuth', '⏰ Safety timeout (1.5s), forcing ready');
          setLoading(false);
          setBootComplete(true);
        }, 1500);
        
        // ✅ BUILD 51: Timeout ABSOLUTO de 2s (garante que loading SEMPRE desliga)
        const absoluteTimeout = setTimeout(() => {
          logger.error('useAuth', '🚨 ABSOLUTE TIMEOUT (2s) - forcing loading OFF');
          setLoading(false);
        }, 2000);

        const { data: { subscription } } = onAuthStateChange(async (user, session) => {
          clearTimeout(safetyTimer);
          clearTimeout(absoluteTimeout);
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
              
              // ✅ BUILD 51: Timeout MUITO agressivo (800ms)
              const profilePromise = getUserProfile(user.id);
              const timeoutPromise = new Promise<null>((resolve) => 
                setTimeout(() => {
                  logger.warn('useAuth', '⚠️ Profile timeout (800ms), skipping');
                  resolve(null);
                }, 800) // 1s → 800ms
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

        // ✅ BUILD 51: FORÇAR disparo inicial imediato (mesmo sem sessão)
        logger.info('useAuth', '🚀 Forcing initial auth check');
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        
        // ✅ Chamar callback manualmente para garantir loading = false
        setTimeout(() => {
          logger.info('useAuth', '🔄 Manual auth callback trigger');
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setSession(session);
          
          if (!currentUser) {
            logger.info('useAuth', '👤 No session found, ready to show auth');
            setUserProfile(null);
            setBootComplete(false);
          }
          
          // ✅ SEMPRE desligar loading
          clearTimeout(safetyTimer);
          clearTimeout(absoluteTimeout);
          setLoading(false);
        }, 100); // 100ms após setup
        
        unsubscribe = () => {
          logger.info('useAuth', '🧹 Cleanup: Unsubscribing');
          clearTimeout(safetyTimer);
          clearTimeout(absoluteTimeout);
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

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

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
