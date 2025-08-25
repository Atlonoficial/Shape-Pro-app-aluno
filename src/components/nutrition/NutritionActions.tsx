import { useCallback } from "react";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const useNutritionActions = () => {
  const { user } = useAuthContext();

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

      // Points are now automatically awarded by database triggers v2
      // No manual point calls needed to prevent duplication
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