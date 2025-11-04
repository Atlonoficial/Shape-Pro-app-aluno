// Update NutritionActions to use new meal logging system
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";
import { useMyNutrition } from "@/hooks/useMyNutrition";

/**
 * Hook que automaticamente dá pontos quando o usuário registra refeições
 * Integrado com sistema de gamificação mais robusto e novo sistema de meal logging
 */
export const useNutritionActions = () => {
  const { awardMealPoints } = useGamificationActions();
  const { logMeal: logMealFromHook } = useMyNutrition();

  const logMeal = async (mealPlanItemId: string, mealName?: string, consumed: boolean = true, notes?: string) => {
    try {
      // Usar o hook atualizado para registrar a refeição
      const success = await logMealFromHook(mealPlanItemId, consumed, notes);
      
      if (!success) {
        toast.error("Erro ao registrar refeição");
        return false;
      }

      // Dar pontos automaticamente apenas se foi marcada como consumida
      if (consumed) {
        await awardMealPoints();
        toast.success(`Refeição "${mealName}" registrada! Você ganhou pontos!`);
      } else {
        toast.success("Refeição desmarcada!");
      }
      
      return true;
    } catch (error) {
      toast.error("Erro ao registrar refeição");
      return false;
    }
  };

  const logBreakfast = (mealPlanItemId: string, name?: string, consumed: boolean = true, notes?: string) => 
    logMeal(mealPlanItemId, `Café da manhã${name ? `: ${name}` : ''}`, consumed, notes);
    
  const logLunch = (mealPlanItemId: string, name?: string, consumed: boolean = true, notes?: string) => 
    logMeal(mealPlanItemId, `Almoço${name ? `: ${name}` : ''}`, consumed, notes);
    
  const logDinner = (mealPlanItemId: string, name?: string, consumed: boolean = true, notes?: string) => 
    logMeal(mealPlanItemId, `Jantar${name ? `: ${name}` : ''}`, consumed, notes);
    
  const logSnack = (mealPlanItemId: string, name?: string, consumed: boolean = true, notes?: string) => 
    logMeal(mealPlanItemId, `Lanche${name ? `: ${name}` : ''}`, consumed, notes);

  return {
    logMeal,
    logBreakfast,
    logLunch,
    logDinner,
    logSnack
  };
};