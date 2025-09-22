import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_by: string;
  assigned_students: string[];
  exercises_data: Array<{
    id: string;
    name: string;
    notes?: string;
    exercises: Array<{
      id: string;
      name: string;
      category: string;
      sets: string;
      reps: number;
      weight?: number;
      duration?: number;
      rest_time: number;
      notes?: string;
    }>;
  }>;
  duration_weeks: number;
  sessions_per_week: number;
  tags: string[];
  notes?: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export const useWorkoutPlans = () => {
  const { user } = useAuth();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkoutPlans = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: queryError } = await supabase
        .from('workout_plans')
        .select('*')
        .contains('assigned_students', [user.id])
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error fetching workout plans:', queryError);
        setError('Erro ao carregar planos de treino');
        return;
      }

      setWorkoutPlans((data || []).map(plan => ({
        ...plan,
        status: plan.status as 'active' | 'inactive' | 'draft',
        difficulty: plan.difficulty as 'beginner' | 'intermediate' | 'advanced',
        exercises_data: Array.isArray(plan.exercises_data) ? plan.exercises_data as any[] : []
      })));
    } catch (err) {
      console.error('Error in fetchWorkoutPlans:', err);
      setError('Erro inesperado ao carregar planos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Real-time subscription para workout_plans
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchWorkoutPlans();

    // Setup real-time subscription
    const channel = supabase
      .channel('workout_plans_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_plans',
        },
        (payload) => {
          console.log('Workout plans realtime update:', payload);
          
          // Check if change affects current user
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const isRelevant = 
            (newRecord && Array.isArray(newRecord.assigned_students) && newRecord.assigned_students.includes(user.id)) ||
            (oldRecord && Array.isArray(oldRecord.assigned_students) && oldRecord.assigned_students.includes(user.id));
            
          if (isRelevant) {
            fetchWorkoutPlans();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchWorkoutPlans]);

  // Get active plans for current user
  const activePlans = workoutPlans.filter(plan => plan.status === 'active');
  
  // Get current plan (most recent active plan)
  const currentPlan = activePlans.length > 0 ? activePlans[0] : null;

  return {
    workoutPlans,
    activePlans,
    currentPlan,
    loading,
    error,
    refetch: fetchWorkoutPlans
  };
};