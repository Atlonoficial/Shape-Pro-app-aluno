import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRealtimeManager } from "./useRealtimeManager";
import { toast } from "sonner";

export interface UserGoal {
  id: string;
  user_id: string;
  teacher_id?: string;
  title: string;
  description?: string;
  category: string;
  target_type: string;
  target_value: number;
  target_unit?: string;
  current_value: number;
  progress_percentage: number;
  status: string;
  start_date: string;
  target_date?: string;
  completed_at?: string;
  points_reward: number;
  is_challenge_based: boolean;
  challenge_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message);
      toast.error('Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createGoal = useCallback(async (goalData: Omit<UserGoal, 'id' | 'user_id' | 'progress_percentage' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_goals')
        .insert({
          ...goalData,
          user_id: user.id
        });

      if (error) throw error;
      
      await fetchGoals();
      toast.success('Meta criada com sucesso! 🎯');
      return true;
    } catch (err: any) {
      console.error('Error creating goal:', err);
      toast.error('Erro ao criar meta');
      return false;
    }
  }, [user?.id, fetchGoals]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<UserGoal>) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;
      
      await fetchGoals();
      toast.success('Meta atualizada! 📈');
      return true;
    } catch (err: any) {
      console.error('Error updating goal:', err);
      toast.error('Erro ao atualizar meta');
      return false;
    }
  }, [fetchGoals]);

  const updateGoalProgress = useCallback(async (goalId: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ current_value: newValue })
        .eq('id', goalId);

      if (error) throw error;
      
      await fetchGoals();
      return true;
    } catch (err: any) {
      console.error('Error updating goal progress:', err);
      toast.error('Erro ao atualizar progresso');
      return false;
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ status: 'cancelled' })
        .eq('id', goalId);

      if (error) throw error;
      
      await fetchGoals();
      toast.success('Meta cancelada');
      return true;
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      toast.error('Erro ao cancelar meta');
      return false;
    }
  }, [fetchGoals]);

  // Estatísticas das metas
  const getGoalStats = useCallback(() => {
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const averageProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + goal.progress_percentage, 0) / activeGoals.length
      : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      averageProgress: Math.round(averageProgress)
    };
  }, [goals]);

  // Buscar metas por categoria
  const getGoalsByCategory = useCallback((category: string) => {
    return goals.filter(goal => goal.category === category && goal.status === 'active');
  }, [goals]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Usar useRealtimeManager para subscriptions consolidadas
  useRealtimeManager({
    subscriptions: user?.id ? [{
      table: 'user_goals',
      event: '*',
      filter: `user_id=eq.${user.id}`,
      callback: () => fetchGoals(),
    }] : [],
    enabled: !!user?.id,
    channelName: 'user-goals',
    debounceMs: 1000,
  });

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    fetchGoals,
    getGoalStats,
    getGoalsByCategory
  };
};