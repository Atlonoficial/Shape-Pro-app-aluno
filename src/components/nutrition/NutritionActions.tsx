import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

/**
 * Hook que automaticamente dá pontos quando o usuário registra refeições
 * Integrado com sistema de gamificação mais robusto
 */
export const useNutritionActions = () => {
  const { awardMealPoints } = useGamificationActions();

  const logMeal = async (mealName: string, calories?: number, mealId?: string) => {
    try {
      // Aqui você faria o registro da refeição no banco de dados
      console.log(`Logging meal: ${mealName}${calories ? ` (${calories} cal)` : ''}`);
      
      // Dar pontos automaticamente
      await awardMealPoints();
      
      toast.success("Refeição registrada! Você ganhou pontos!");
    } catch (error) {
      console.error('Error logging meal:', error);
      toast.error("Erro ao registrar refeição");
    }
  };

  const logBreakfast = (name: string, calories?: number, mealId?: string) => 
    logMeal(`Café da manhã: ${name}`, calories, mealId);
  const logLunch = (name: string, calories?: number, mealId?: string) => 
    logMeal(`Almoço: ${name}`, calories, mealId);
  const logDinner = (name: string, calories?: number, mealId?: string) => 
    logMeal(`Jantar: ${name}`, calories, mealId);
  const logSnack = (name: string, calories?: number, mealId?: string) => 
    logMeal(`Lanche: ${name}`, calories, mealId);

  return {
    logMeal,
    logBreakfast,
    logLunch,
    logDinner,
    logSnack
  };
};