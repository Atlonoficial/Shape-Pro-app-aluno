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

  // ✅ CORREÇÃO DEFINITIVA: useRef interno para prevenir múltiplas inicializações
  const initRef = useRef(false);
  
  useEffect(() => {
    if (initRef.current) {
      logger.warn('useAuth', '⚠️ BLOCKED: Already initialized in this instance');
      return;
    }
    
    initRef.current = true;
    logger.info('useAuth', '🔄 useAuth initialization starting');

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        // ✅ BUILD 51: Timeout reduzido para 3s (5s → 3s)
        await bootManager.waitForBoot(3000);
        logger.info('useAuth', '✅ Boot complete, setting up auth listener');

        // ✅ Safety timeout aumentado para 8s (permite operações completarem)
        const safetyTimer = setTimeout(() => {
          logger.warn('useAuth', '⏰ Safety timeout (8s), forcing ready');
          setLoading(false);
          setBootComplete(true);
        }, 8000);

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
              
              // ✅ Timeout realista (5s) para permitir retry logic completar
              const profilePromise = getUserProfile(user.id);
              const timeoutPromise = new Promise<null>((resolve) => 
                setTimeout(() => {
                  logger.warn('useAuth', '⚠️ Profile timeout (5s), skipping');
                  resolve(null);
                }, 5000)
              );
              
              const profile = await Promise.race([profilePromise, timeoutPromise]);
              
              if (profile) {
                logger.info('useAuth', '✅ Profile loaded:', {
                  userType: profile?.user_type
                });
                setUserProfile(profile);
              } else {
                logger.warn('useAuth', '⚠️ No profile, using fallback from user metadata');
                
                // ✅ FALLBACK: Criar profile mínimo a partir do user metadata
                const fallbackProfile = {
                  id: user.id,
                  email: user.email || '',
                  name: user.user_metadata?.name || 'Usuário',
                  user_type: user.user_metadata?.user_type || 'student',
                  profile_complete: false
                };
                
                setUserProfile(fallbackProfile as any);
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
          setLoading(false);
        }, 100); // 100ms após setup
        
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
