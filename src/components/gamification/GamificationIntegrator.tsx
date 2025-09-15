import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRealtimeGamification } from "@/hooks/useRealtimeGamification";

/**
 * Component that integrates gamification throughout the app
 * This should be placed at the root level to ensure gamification works everywhere
 */
export const GamificationIntegrator = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  
  // Removido updateStreak daqui para evitar duplicação
  // O gamification já é inicializado no useRealtimeGamification hook

  return <>{children}</>;
};