import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

/**
 * Hook que automaticamente dá pontos quando o usuário registra refeições
 */
export const useNutritionActions = () => {
  const { awardMealPoints } = useGamificationActions();

  const logMeal = async (mealName: string, calories?: number) => {
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

  const logBreakfast = (name: string, calories?: number) => logMeal(`Café da manhã: ${name}`, calories);
  const logLunch = (name: string, calories?: number) => logMeal(`Almoço: ${name}`, calories);
  const logDinner = (name: string, calories?: number) => logMeal(`Jantar: ${name}`, calories);
  const logSnack = (name: string, calories?: number) => logMeal(`Lanche: ${name}`, calories);

  return {
    logMeal,
    logBreakfast,
    logLunch,
    logDinner,
    logSnack
  };
};