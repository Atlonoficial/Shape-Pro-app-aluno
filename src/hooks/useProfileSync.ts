import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { getUserProfile } from "@/lib/supabase";
import { useRealtimeManager } from "@/hooks/useRealtimeManager";

export const useProfileSync = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // Realtime subscriptions using centralized manager
  useRealtimeManager({
    subscriptions: [
      {
        table: 'profiles',
        event: '*',
        filter: `id=eq.${user?.id}`,
        callback: (payload) => {
          console.log('Profile change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          queryClient.invalidateQueries({ queryKey: ['user_profile'] });
        }
      },
      {
        table: 'students',
        event: '*',
        filter: `user_id=eq.${user?.id}`,
        callback: (payload) => {
          console.log('Student data change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['student', user.id] });
          queryClient.invalidateQueries({ queryKey: ['student_profile'] });
        }
      }
    ],
    enabled: !!user?.id,
    channelName: `profile-sync-${user?.id}`,
    debounceMs: 2000
  });

  const forceSync = async () => {
    if (!user?.id) return;
    
    setSyncing(true);
    try {
      // Force refresh all profile-related queries
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['student'] });
      await queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      await queryClient.invalidateQueries({ queryKey: ['student_profile'] });
      
      // Clear React Query cache completely for profile data
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.removeQueries({ queryKey: ['user_profile'] });
      
      // Fetch fresh profile data
      const freshProfile = await getUserProfile(user.id);
      if (freshProfile) {
        // Update all relevant query caches
        queryClient.setQueryData(['profile', user.id], freshProfile);
        queryClient.setQueryData(['user_profile'], freshProfile);
      }
      
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['profile', user.id] });
      await queryClient.refetchQueries({ queryKey: ['student', user.id] });
    } catch (error) {
      console.error('Error syncing profile:', error);
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    forceSync,
  };
};