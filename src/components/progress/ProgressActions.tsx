import { useCallback } from "react";
import { useGoalActions } from "@/hooks/useGoalActions";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const useProgressActions = () => {
  const { user } = useAuthContext();
  const { updateGoalsProgress } = useGoalActions();

  const recordProgress = useCallback(async (progressData: {
    type: string;
    value: number;
    unit: string;
    notes?: string;
    workout_id?: string;
    meal_id?: string;
  }) => {
    console.log('📊 Recording progress - auth check...');
    console.log('User from context:', user);
    
    if (!user?.id) {
      console.error('❌ User not authenticated in recordProgress');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      console.log('📤 Inserting progress record:', {
        user_id: user.id,
        type: progressData.type,
        value: progressData.value,
        unit: progressData.unit,
        notes: progressData.notes,
        workout_id: progressData.workout_id,
        meal_id: progressData.meal_id,
        date: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from('progress')
        .insert({
          user_id: user.id,
          type: progressData.type,
          value: progressData.value,
          unit: progressData.unit,
          notes: progressData.notes,
          workout_id: progressData.workout_id,
          meal_id: progressData.meal_id,
          date: new Date().toISOString()
        })
        .select();

      console.log('📊 Progress insert result:', { data, error });

      if (error) {
        console.error('❌ Error recording progress:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          toast.error('Erro de permissão. Verifique se você está logado.');
        } else {
          toast.error('Erro ao registrar progresso');
        }
        return false;
      }

      // Atualizar progresso nas metas baseado no tipo
      const categoryMap: Record<string, string> = {
        'weight': 'peso',
        'workout': 'frequencia',
        'cardio': 'cardio',
        'strength': 'forca'
      };
      
      const goalCategory = categoryMap[progressData.type];
      if (goalCategory) {
        console.log('🎯 Updating goals progress for category:', goalCategory);
        await updateGoalsProgress(goalCategory, progressData.value);
      }

      // Points are now automatically awarded by database triggers v2
      // No manual point calls needed to prevent duplication
      console.log('✅ Progress recorded successfully');
      toast.success('Progresso registrado com sucesso! 🎯');
      return true;
    } catch (error) {
      console.error('❌ Unexpected error recording progress:', error);
      toast.error('Erro inesperado ao registrar progresso');
      return false;
    }
  }, [user?.id, updateGoalsProgress]);

  const recordWeight = useCallback(async (weight: number, notes?: string) => {
    return await recordProgress({
      type: 'weight',
      value: weight,
      unit: 'kg',
      notes: notes || 'Peso registrado'
    });
  }, [recordProgress]);

  return {
    recordProgress,
    recordWeight
  } as const;
};