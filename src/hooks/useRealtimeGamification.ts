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

  // Function to award points for various actions
  const awardPointsForAction = useCallback(async (action: string, description?: string) => {
    if (!user?.id) return;

    try {
      // Update streak first
      await supabase.rpc("update_user_streak", { p_user_id: user.id });

      // Award points based on action
      const { error } = await supabase.rpc("award_points_enhanced", {
        p_user_id: user.id,
        p_activity_type: action,
        p_description: description || `Ação: ${action}`,
        p_metadata: { timestamp: new Date().toISOString() }
      });

      if (error) {
        console.error("Error awarding points:", error);
        return;
      }

      console.log(`Points awarded for ${action}:`, description);
    } catch (error) {
      console.error("Error in awardPointsForAction:", error);
    }
  }, [user?.id]);

  // Function to update streak
  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc("update_user_streak", { p_user_id: user.id });
      if (error) {
        console.error("Error updating streak:", error);
      }
    } catch (error) {
      console.error("Error in updateStreak:", error);
    }
  }, [user?.id]);

  // Auto-award points for daily check-in
  useEffect(() => {
    if (user?.id) {
      // Award daily check-in points when user loads the app
      const lastCheckIn = localStorage.getItem(`lastCheckIn_${user.id}`);
      const today = new Date().toDateString();
      
      if (lastCheckIn !== today) {
        setTimeout(() => {
          awardPointsForAction("daily_checkin", "Check-in diário no app");
          localStorage.setItem(`lastCheckIn_${user.id}`, today);
        }, 2000); // Delay to let the app fully load
      }
    }
  }, [user?.id, awardPointsForAction]);

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
    return awardPointsForAction("progress_updated", `Progresso atualizado${progressType ? `: ${progressType}` : ""}`);
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