import { useCallback } from "react";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const useProgressActions = () => {
  const { user } = useAuthContext();
  const { awardProgressPoints } = useGamificationActions();

  const recordProgress = useCallback(async (progressData: {
    type: string;
    value: number;
    unit: string;
    notes?: string;
  }) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('progress_records')
        .insert({
          user_id: user.id,
          type: progressData.type,
          value: progressData.value,
          unit: progressData.unit,
          notes: progressData.notes,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording progress:', error);
        toast.error('Erro ao registrar progresso');
        return false;
      }

      // Award points for progress update
      await awardProgressPoints(progressData.type);
      toast.success('Progresso registrado com sucesso! 🎯');
      return true;
    } catch (error) {
      console.error('Error recording progress:', error);
      toast.error('Erro ao registrar progresso');
      return false;
    }
  }, [user?.id, awardProgressPoints]);

  return {
    recordProgress
  };
};