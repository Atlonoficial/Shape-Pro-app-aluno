import { useCallback } from "react";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const useNutritionActions = () => {
  const { user } = useAuthContext();
  const { awardMealPoints } = useGamificationActions();

  const logMeal = useCallback(async (mealData: {
    meal_id?: string;
    nutrition_plan_id?: string;
    date: string;
    consumed: boolean;
    rating?: number;
    notes?: string;
    photo_url?: string;
  }) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          ...mealData
        });

      if (error) {
        console.error('Error logging meal:', error);
        toast.error('Erro ao registrar refeição');
        return false;
      }

      // Points will be automatically awarded by the database trigger
      // But we can show immediate feedback
      if (mealData.consumed) {
        toast.success('Refeição registrada com sucesso! 🍽️');
      }
      
      return true;
    } catch (error) {
      console.error('Error logging meal:', error);
      toast.error('Erro ao registrar refeição');
      return false;
    }
  }, [user?.id]);

  return {
    logMeal
  };
};