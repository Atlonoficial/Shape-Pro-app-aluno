import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";

export const useProfileSync = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Realtime subscription para profiles
    const profileChannel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          queryClient.invalidateQueries({ queryKey: ['user_profile'] });
        }
      )
      .subscribe();

    // Realtime subscription para students
    const studentChannel = supabase
      .channel('student_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Student data change detected:', payload);
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['student', user.id] });
          queryClient.invalidateQueries({ queryKey: ['student_profile'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(studentChannel);
    };
  }, [user?.id, queryClient]);

  const forceSync = async () => {
    if (!user?.id) return;
    
    setSyncing(true);
    try {
      // Force refresh all profile-related queries
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['student'] });
      await queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      await queryClient.invalidateQueries({ queryKey: ['student_profile'] });
      
      // Refetch immediately
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