import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRealtimeGamification } from "@/hooks/useRealtimeGamification";

/**
 * Component that integrates gamification throughout the app
 * This should be placed at the root level to ensure gamification works everywhere
 */
export const GamificationIntegrator = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();

  // Gamificação é inicializada automaticamente pelo useRealtimeGamification
  // Não há necessidade de duplicar a inicialização aqui
  useEffect(() => {
    if (user?.id) {
      console.log('[GamificationIntegrator] User authenticated, gamification will auto-initialize:', user.id);
    }
  }, [user?.id]);

  return <>{children}</>;
};