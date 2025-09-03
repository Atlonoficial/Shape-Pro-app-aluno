import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

/**
 * Hook que automaticamente dá pontos quando o usuário registra progresso
 */
export const useProgressActions = () => {
  const { awardProgressPoints } = useGamificationActions();

  const logProgress = async (type: string, value: number, unit: string) => {
    try {
      // Aqui você faria o registro do progresso no banco de dados
      console.log(`Registering progress: ${type} = ${value} ${unit}`);
      
      // Dar pontos automaticamente
      await awardProgressPoints();
      
      toast.success("Progresso registrado! Você ganhou pontos!");
    } catch (error) {
      console.error('Error logging progress:', error);
      toast.error("Erro ao registrar progresso");
    }
  };

  const logWeight = (weight: number) => logProgress("weight", weight, "kg");
  const logBodyFat = (bodyFat: number) => logProgress("body_fat", bodyFat, "%");
  const logMuscle = (muscle: number) => logProgress("muscle_mass", muscle, "kg");

  return {
    logProgress,
    logWeight,
    logBodyFat,
    logMuscle
  };
};