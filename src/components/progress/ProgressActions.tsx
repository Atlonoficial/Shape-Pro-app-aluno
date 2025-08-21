import { useCallback } from "react";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

export const useProgressActions = () => {
  const { awardProgressPoints } = useGamificationActions();

  const recordProgress = useCallback(async (progressData: {
    type: string;
    value: number;
    unit: string;
    notes?: string;
  }) => {
    try {
      // Award points for progress update directly
      await awardProgressPoints(progressData.type);
      toast.success('Progresso registrado com sucesso! 🎯');
      return true;
    } catch (error) {
      console.error('Error recording progress:', error);
      toast.error('Erro ao registrar progresso');
      return false;
    }
  }, [awardProgressPoints]);

  const recordWeight = useCallback(async (weight: number, notes?: string) => {
    return recordProgress({
      type: 'weight',
      value: weight,
      unit: 'kg',
      notes
    });
  }, [recordProgress]);

  return {
    recordProgress,
    recordWeight
  };
};