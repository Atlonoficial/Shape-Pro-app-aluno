import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
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

    // Real-time subscription for profile changes
    let profileChannel: any = null;
    if (user?.id) {
      profileChannel = supabase
        .channel('profile_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          async (payload) => {
            console.log('[useAuth] Profile updated in real-time:', payload);
            try {
              const updatedProfile = await getUserProfile(user.id);
              setUserProfile(updatedProfile);
            } catch (error) {
              console.error('[useAuth] Error syncing profile:', error);
            }
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [user?.id]);

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