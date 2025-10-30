import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRealtimeGamification } from "@/hooks/useRealtimeGamification";

/**
 * Hook que integra automaticamente ações do usuário com gamificação
 * Este hook observa mudanças no comportamento do usuário e automaticamente
 * atribui pontos quando necessário
 */
export const useGamificationIntegration = () => {
  const { user } = useAuthContext();
  const { awardPointsForAction, updateStreak } = useRealtimeGamification();

  // Atualizar streak diariamente
  useEffect(() => {
    if (user?.id) {
      updateStreak();
    }
  }, [user?.id, updateStreak]);

  return {
    awardPointsForAction,
    updateStreak
  };
};