import { useEffect, useCallback, useRef } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { showPointsToast } from "@/components/gamification/PointsToast";
import { useGamificationDebounce } from "@/hooks/useGamificationDebounce";
import { useTeacherGamificationSettings } from "@/hooks/useTeacherGamificationSettings";
import { useRealtimeManager } from "@/hooks/useRealtimeManager";

interface RealtimeGamificationHook {
  awardPointsForAction: (action: string, description?: string, metadata?: any) => Promise<void>;
  updateStreak: () => Promise<void>;
}

export const useRealtimeGamification = (): RealtimeGamificationHook => {
  const { user } = useAuthContext();
  const { isDuplicateAction, generateActionKey } = useGamificationDebounce();
  const { settings, teacherId } = useTeacherGamificationSettings();

  const awardPointsForAction = useCallback(async (action: string, description?: string, metadata: any = {}) => {
    if (!user?.id) {
      console.warn('[Gamification] ❌ User not authenticated');
      return;
    }

    // Verificar se é uma ação duplicada (debounce local)
    const actionKey = generateActionKey(action, user.id, metadata);
    if (isDuplicateAction(actionKey)) {
      console.log('[Gamification] ⏸️ Duplicate action prevented by debounce:', action);
      return;
    }

    try {
      console.log('[Gamification] 🎯 Attempting to award points:', { action, description, metadata, userId: user.id });

      // USAR FUNÇÃO V3 EXISTENTE QUE PREVINE DUPLICAÇÕES
      const { data, error } = await supabase.rpc('award_points_enhanced_v3', {
        p_user_id: user.id,
        p_activity_type: action,
        p_description: description || `Ação executada: ${action}`,
        p_metadata: metadata,
        p_custom_points: null
      });

      if (error) {
        console.error('[Gamification] ❌ RPC Error:', error);
        toast.error(`Erro de gamificação: ${error.message}`);
        return;
      }

      console.log('[Gamification] 📦 RPC Response:', data);

      // Verificar se a função retornou indicação de duplicação
      if (data && typeof data === 'object' && 'duplicate' in data && data.duplicate) {
        console.log('[Gamification] ⏸️ Duplicate action detected by server:', (data as any).message);
        return;
      }

      // Verificar limite diário
      if (data && typeof data === 'object' && 'daily_limit_reached' in data && data.daily_limit_reached) {
        console.log('[Gamification] ⚠️ Daily limit reached');
        toast.info('Limite diário de pontos atingido!');
        return;
      }

      // Verificar se não recebeu pontos por falta de configuração
      if (data && typeof data === 'object' && 'success' in data && data.success === true && (data as any).points_awarded === 0) {
        console.log('[Gamification] ⚠️ No points awarded (no settings?):', data);
        return;
      }

      // ✅ Sucesso! Mostrar feedback visual
      if (data && typeof data === 'object' && 'success' in data && data.success && 'points_awarded' in data) {
        const points = (data as any).points_awarded;
        if (points > 0) {
          console.log('[Gamification] ✅ Points awarded successfully!', { action, points, total: (data as any).total_points });
          showPointsToast({ points, activity: description || action });

          // Disparar evento para atualizar UI
          window.dispatchEvent(new CustomEvent('gamification-updated'));
        }
      }
    } catch (error) {
      console.error('[Gamification] ❌ Exception:', error);
      toast.error('Erro ao processar pontos de gamificação');
    }
  }, [user?.id, isDuplicateAction, generateActionKey]);

  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Verificar se já existe check-in hoje
      const { data: existingActivity, error: checkError } = await supabase
        .from('gamification_activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('activity_type', 'daily_checkin')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .maybeSingle();

      if (checkError) {
        console.error('[Gamification] ❌ Error checking existing checkin:', checkError);
        return;
      }

      if (!existingActivity) {
        console.log('[Gamification] 📅 No checkin today, awarding daily points...');
        await awardPointsForAction('daily_checkin', 'Check-in diário');
      } else {
        console.log('[Gamification] ✓ Checkin already exists today');
      }
    } catch (error) {
      console.error('[Gamification] ❌ Error updating streak:', error);
    }
  }, [user?.id, awardPointsForAction]);

  // Log settings for debugging
  useEffect(() => {
    if (settings) {
      console.log('[Gamification] ⚙️ Current teacher settings loaded:', settings);
    }
  }, [settings]);

  return {
    awardPointsForAction,
    updateStreak
  };
};

// Hook específico para ações comuns
export const useGamificationActions = () => {
  const { awardPointsForAction } = useRealtimeGamification();

  const awardWorkoutPoints = useCallback((workoutName?: string) => {
    console.log('[Gamification] 💪 Awarding workout points:', workoutName);
    return awardPointsForAction("training_completed", `Treino completado${workoutName ? `: ${workoutName}` : ""}`);
  }, [awardPointsForAction]);

  const awardMealPoints = useCallback((mealId?: string) => {
    console.log('[Gamification] 🍽️ Awarding meal points:', mealId);
    return awardPointsForAction("meal_logged", "Refeição registrada", { meal_id: mealId });
  }, [awardPointsForAction]);

  const awardProgressPoints = useCallback((progressType?: string) => {
    console.log('[Gamification] 📈 Awarding progress points:', progressType);
    return awardPointsForAction("progress_logged", `Progresso atualizado${progressType ? `: ${progressType}` : ""}`);
  }, [awardPointsForAction]);

  const awardAIInteractionPoints = useCallback(() => {
    console.log('[Gamification] 🤖 Awarding AI interaction points');
    return awardPointsForAction("ai_interaction", "Interação com IA");
  }, [awardPointsForAction]);

  const awardTeacherMessagePoints = useCallback(() => {
    console.log('[Gamification] 💬 Awarding teacher message points');
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