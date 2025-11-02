import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';
import { logger } from '@/utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de segurança (8 segundos)
    const safetyTimeout = setTimeout(() => {
      logger.error('[useAuth] ⚠️ Timeout: Auth state não resolveu em 8s');
      setLoading(false); // Forçar fim do loading
    }, 8000);

    const { data: { subscription } } = onAuthStateChange(async (user, session) => {
      clearTimeout(safetyTimeout); // Cancelar timeout se resolver
      setUser(user);
      setSession(session);
      
      logger.log('[useAuth] Auth state changed:', { userId: user?.id, email: user?.email });
      
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
          logger.log('[useAuth] Profile loaded:', profile);
        } catch (error) {
          logger.error('[useAuth] Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        logger.log('[useAuth] User logged out');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Use centralized realtime manager for profile changes
  useRealtimeManager({
    subscriptions: user?.id ? [{
      table: 'profiles',
      event: '*',
      filter: `id=eq.${user.id}`,
      callback: async () => {
        logger.log('[useAuth] Profile updated in real-time');
        try {
          if (user?.id) {
            const updatedProfile = await getUserProfile(user.id);
            setUserProfile(updatedProfile);
          }
        } catch (error) {
          logger.error('[useAuth] Error syncing profile:', error);
        }
      }
    }] : [],
    enabled: !!user?.id,
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