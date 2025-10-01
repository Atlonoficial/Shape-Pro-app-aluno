import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (user, session) => {
      setUser(user);
      setSession(session);
      
      console.log('[useAuth] Auth state changed:', { userId: user?.id, email: user?.email });
      
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
          console.log('[useAuth] Profile loaded:', profile);
        } catch (error) {
          console.error('[useAuth] Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        console.log('[useAuth] User logged out');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
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