import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

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
      
      // ✅ BUILD 52: Query otimizada com eq + or (mais rápido que contains)
      const { data, error: queryError } = await supabase
        .from('workout_plans')
        .select('*')
        .or(`assigned_students.cs.{${user.id}},created_by.eq.${user.id}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) {
        setError('Erro ao carregar planos de treino');
        setWorkoutPlans([]);
        return;
      }

      setWorkoutPlans((data || []).map(plan => ({
        ...plan,
        status: plan.status as 'active' | 'inactive' | 'draft',
        difficulty: plan.difficulty as 'beginner' | 'intermediate' | 'advanced',
        exercises_data: Array.isArray(plan.exercises_data) ? plan.exercises_data as any[] : []
      })));
    } catch (err) {
      setError('Erro inesperado ao carregar planos');
      setWorkoutPlans([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchWorkoutPlans();
  }, [user?.id, fetchWorkoutPlans]);

  // Realtime subscriptions using centralized manager
  useRealtimeManager({
    subscriptions: [
      {
        table: 'workout_plans',
        event: '*',
        callback: (payload) => {
          console.log('Workout plans realtime update:', payload);
          
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const isRelevant = 
            (newRecord && Array.isArray(newRecord.assigned_students) && newRecord.assigned_students.includes(user?.id)) ||
            (oldRecord && Array.isArray(oldRecord.assigned_students) && oldRecord.assigned_students.includes(user?.id));
            
          if (isRelevant) {
            fetchWorkoutPlans();
          }
        }
      }
    ],
    enabled: !!user?.id,
    channelName: `workout-plans-${user?.id}`,
    debounceMs: 500
  });

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