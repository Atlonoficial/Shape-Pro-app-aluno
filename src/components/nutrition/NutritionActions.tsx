import { useCallback } from "react";
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
    console.log('🍽️ Logging meal - auth check...');
    console.log('User from context:', user);
    
    if (!user?.id) {
      console.error('❌ User not authenticated in logMeal');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      console.log('📤 Inserting meal log:', {
        user_id: user.id,
        ...mealData
      });

      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          ...mealData
        })
        .select();

      console.log('🍽️ Meal log result:', { data, error });

      if (error) {
        console.error('❌ Error logging meal:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          toast.error('Erro de permissão. Verifique se você está logado.');
        } else {
          toast.error('Erro ao registrar refeição');
        }
        return false;
      }

      // Points are now automatically awarded by database triggers v2
      // No manual point calls needed to prevent duplication
      if (mealData.consumed) {
        console.log('✅ Meal logged successfully');
        toast.success('Refeição registrada com sucesso! 🍽️');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Unexpected error logging meal:', error);
      toast.error('Erro inesperado ao registrar refeição');
      return false;
    }
  }, [user?.id]);

  return {
    logMeal
  };
};