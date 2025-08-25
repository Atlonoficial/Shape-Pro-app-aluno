import { useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { showPointsToast } from "@/components/gamification/PointsToast";

interface RealtimeGamificationHook {
  awardPointsForAction: (action: string, description?: string) => Promise<void>;
  updateStreak: () => Promise<void>;
}

export const useRealtimeGamification = (): RealtimeGamificationHook => {
  const { user } = useAuthContext();

  const awardPointsForAction = useCallback(async (action: string, description?: string) => {
    if (!user?.id) {
      console.warn('[Gamification] User not authenticated');
      return;
    }

    try {
      // USAR NOVA FUNÇÃO V2 QUE PREVINE DUPLICAÇÕES
      const { error } = await supabase.rpc('award_points_enhanced_v2', {
        p_user_id: user.id,
        p_activity_type: action,
        p_description: description || `Ação executada: ${action}`,
        p_metadata: {},
        p_custom_points: null
      });

      if (error) {
        console.error('[Gamification] Error awarding points:', error);
        return;
      }

      console.log('[Gamification] Points awarded successfully for action:', action);
    } catch (error) {
      console.error('[Gamification] Error awarding points:', error);
    }
  }, [user?.id]);

  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingActivity } = await supabase
        .from('gamification_activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('activity_type', 'daily_checkin')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .single();

      if (!existingActivity) {
        await awardPointsForAction('daily_checkin', 'Check-in diário');
      }
    } catch (error) {
      console.error('[Gamification] Error updating streak:', error);
    }
  }, [user?.id, awardPointsForAction]);

  // Dar pontos de check-in na primeira carga do app
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

// Hook específico para ações comuns
export const useGamificationActions = () => {
  const { awardPointsForAction } = useRealtimeGamification();

  const awardWorkoutPoints = useCallback((workoutName?: string) => {
    return awardPointsForAction("training_completed", `Treino completado${workoutName ? `: ${workoutName}` : ""}`);
  }, [awardPointsForAction]);

  const awardMealPoints = useCallback(() => {
    return awardPointsForAction("meal_logged", "Refeição registrada");
  }, [awardPointsForAction]);

  const awardProgressPoints = useCallback((progressType?: string) => {
    return awardPointsForAction("progress_logged", `Progresso atualizado${progressType ? `: ${progressType}` : ""}`);
  }, [awardPointsForAction]);

  const awardAIInteractionPoints = useCallback(() => {
    return awardPointsForAction("ai_interaction", "Interação com IA");
  }, [awardPointsForAction]);

  const awardTeacherMessagePoints = useCallback(() => {
    return awardPointsForAction("teacher_message", "Mensagem do professor");
  }, [awardPointsForAction]);

  return {
    awardWorkoutPoints,
    awardMealPoints,
    awardProgressPoints,
    awardAIInteractionPoints,
    awardTeacherMessagePoints
  };
};