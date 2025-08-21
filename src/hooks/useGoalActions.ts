import { useCallback } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook para integrar progresso do usuário com atualização automática de metas
 * Este hook conecta ações do sistema com as metas do usuário
 */
export const useGoalActions = () => {
  const { user } = useAuthContext();
  const { awardProgressPoints } = useGamificationActions();

  // Função para atualizar progresso de metas baseado em categoria
  const updateGoalsProgress = useCallback(async (category: string, value: number) => {
    if (!user?.id) return;

    try {
      // Chamar função do banco para atualizar progresso
      const { error } = await supabase.rpc('update_goal_progress', {
        p_user_id: user.id,
        p_category: category,
        p_value: value
      });

      if (error) {
        console.error('Error updating goals progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating goals progress:', error);
      return false;
    }
  }, [user?.id]);

  // Atualizar progresso de peso
  const updateWeightProgress = useCallback(async (weight: number) => {
    const success = await updateGoalsProgress('peso', weight);
    if (success) {
      await awardProgressPoints('Peso atualizado');
      toast.success('Progresso de peso atualizado nas suas metas! 📈');
    }
    return success;
  }, [updateGoalsProgress, awardProgressPoints]);

  // Atualizar progresso de treino (frequência)
  const updateWorkoutProgress = useCallback(async () => {
    const success = await updateGoalsProgress('frequencia', 1);
    if (success) {
      await awardProgressPoints('Treino completado');
      toast.success('Progresso de treino atualizado nas suas metas! 💪');
    }
    return success;
  }, [updateGoalsProgress, awardProgressPoints]);

  // Atualizar progresso de cardio
  const updateCardioProgress = useCallback(async (distance: number) => {
    const success = await updateGoalsProgress('cardio', distance);
    if (success) {
      await awardProgressPoints('Cardio completado');
      toast.success('Progresso de cardio atualizado nas suas metas! 🏃‍♂️');
    }
    return success;
  }, [updateGoalsProgress, awardProgressPoints]);

  // Atualizar progresso de força
  const updateStrengthProgress = useCallback(async (weight: number) => {
    const success = await updateGoalsProgress('forca', weight);
    if (success) {
      await awardProgressPoints('Exercício de força completado');
      toast.success('Progresso de força atualizado nas suas metas! 🏋️‍♂️');
    }
    return success;
  }, [updateGoalsProgress, awardProgressPoints]);

  return {
    updateGoalsProgress,
    updateWeightProgress,
    updateWorkoutProgress,
    updateCardioProgress,
    updateStrengthProgress
  };
};