import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { useRealtimeManager } from './useRealtimeManager';
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    console.log('[useAuth] 🔄 STEP 1: Setting up auth state change subscription');
    
    // ✅ FASE 5: Safety timeout de 8 segundos
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.error('[useAuth] ⚠️ SAFETY TIMEOUT: onAuthStateChange não disparou após 8s');
        console.log('[useAuth] Forçando loading=false para desbloquear UI');
        setLoading(false);
        setBootComplete(true);
      }
    }, 8000);
    
    const { data: { subscription } } = onAuthStateChange(async (user, session) => {
      clearTimeout(safetyTimeout); // Cancelar timeout se auth funcionar
      
      console.log('[useAuth] 🔥 STEP 2: onAuthStateChange FIRED!', {
        userId: user?.id || 'null',
        email: user?.email || 'null',
        hasSession: !!session,
        timestamp: new Date().toISOString()
      });
      
      setUser(user);
      setSession(session);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
          console.log('[useAuth] ✅ STEP 3: Profile loaded:', profile?.user_type);
          
          setBootComplete(true);
          console.log('[useAuth] ✅ STEP 4: Boot complete, realtime enabled');
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
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loading]);

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