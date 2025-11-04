import { useState, useEffect, useCallback, useRef } from 'react';
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

  // ✅ BUILD 53: Cache de 1 minuto
  const cacheRef = useRef<{ data: WorkoutPlan[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 60000; // 1 minuto

  const fetchWorkoutPlans = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // ✅ BUILD 53: Usar cache se ainda válido
    if (!forceRefresh && cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
      setWorkoutPlans(cacheRef.current.data);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // ✅ BUILD 53: Query corrigida - buscar todos ativos e filtrar no client
      const { data, error: queryError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('status', 'active')
        .or(`created_by.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) {
        setError('Erro ao carregar planos de treino');
        setWorkoutPlans([]);
        return;
      }

      // ✅ BUILD 53: Filtrar no client-side (mais confiável que operadores complexos)
      const filtered = (data || []).filter(plan =>
        plan.created_by === user.id ||
        (Array.isArray(plan.assigned_students) && plan.assigned_students.includes(user.id))
      );

      const formatted = filtered.map(plan => ({
        ...plan,
        status: plan.status as 'active' | 'inactive' | 'draft',
        difficulty: plan.difficulty as 'beginner' | 'intermediate' | 'advanced',
        exercises_data: Array.isArray(plan.exercises_data) ? plan.exercises_data as any[] : []
      }));

      // ✅ BUILD 53: Atualizar cache
      cacheRef.current = { data: formatted, timestamp: Date.now() };
      setWorkoutPlans(formatted);
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

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

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