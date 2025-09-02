import { useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { showPointsToast } from "@/components/gamification/PointsToast";
import { useGamificationDebounce } from "@/hooks/useGamificationDebounce";

interface RealtimeGamificationHook {
  awardPointsForAction: (action: string, description?: string) => Promise<void>;
  updateStreak: () => Promise<void>;
}

export const useRealtimeGamification = (): RealtimeGamificationHook => {
  const { user } = useAuthContext();
  const { isDuplicateAction, generateActionKey } = useGamificationDebounce();

  const awardPointsForAction = useCallback(async (action: string, description?: string, metadata: any = {}) => {
    if (!user?.id) {
      console.warn('[Gamification] User not authenticated');
      return;
    }

    // Verificar se é uma ação duplicada
    const actionKey = generateActionKey(action, user.id, metadata);
    if (isDuplicateAction(actionKey)) {
      console.log('[Gamification] Duplicate action prevented:', action);
      return;
    }

    try {
      console.log('[Gamification] Awarding points for action:', action, 'metadata:', metadata);
      
      // USAR NOVA FUNÇÃO V3 QUE PREVINE DUPLICAÇÕES
      const { data, error } = await supabase.rpc('award_points_enhanced_v3', {
        p_user_id: user.id,
        p_activity_type: action,
        p_description: description || `Ação executada: ${action}`,
        p_metadata: metadata,
        p_custom_points: null
      });

      if (error) {
        console.error('[Gamification] Error awarding points:', error);
        return;
      }

      // Verificar se a função retornou indicação de duplicação
      if (data && data.duplicate) {
        console.log('[Gamification] Duplicate action detected by server:', data.message);
        return;
      }

      console.log('[Gamification] Points awarded successfully for action:', action, 'Result:', data);
    } catch (error) {
      console.error('[Gamification] Error awarding points:', error);
    }
  }, [user?.id, isDuplicateAction, generateActionKey]);

  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Verificar se já existe check-in hoje com timestamp preciso para evitar duplicação
      const { data: existingActivity, error: checkError } = await supabase
        .from('gamification_activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('activity_type', 'daily_checkin')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .maybeSingle(); // Use maybeSingle em vez de single para evitar erro quando não encontra

      if (checkError) {
        console.error('[Gamification] Error checking existing checkin:', checkError);
        return;
      }

      if (!existingActivity) {
        console.log('[Gamification] No checkin today, awarding points');
        await awardPointsForAction('daily_checkin', 'Check-in diário');
      } else {
        console.log('[Gamification] Checkin already exists today, skipping');
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