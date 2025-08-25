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

    return () => subscription.unsubscribe();
  }, []);

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