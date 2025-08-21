import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRealtimeGamification } from "@/hooks/useRealtimeGamification";

/**
 * Component that integrates gamification throughout the app
 * This should be placed at the root level to ensure gamification works everywhere
 */
export const GamificationIntegrator = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  const { updateStreak } = useRealtimeGamification();

  // Update streak when app loads
  useEffect(() => {
    if (user?.id) {
      updateStreak();
    }
  }, [user?.id, updateStreak]);

  return <>{children}</>;
};