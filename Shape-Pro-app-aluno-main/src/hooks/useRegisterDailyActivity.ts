import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to automatically register daily activity for the authenticated user.
 * Registers activity when component mounts and every 30 minutes for long sessions.
 */
export const useRegisterDailyActivity = () => {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const registerActivity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Call the RPC function to register daily activity (UPSERT)
        const { error } = await supabase.rpc('register_daily_activity');
        
        if (error) {
          console.error('Error registering daily activity:', error);
        } else {
          console.log('Daily activity registered successfully');
        }
      } catch (err) {
        console.error('Failed to register daily activity:', err);
      }
    };

    // Register activity immediately
    registerActivity();

    // Set up interval to register activity every 30 minutes
    // This ensures long sessions are tracked properly
    intervalRef.current = setInterval(() => {
      registerActivity();
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};
