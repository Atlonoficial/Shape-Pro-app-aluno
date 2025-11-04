import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  created_by: string;
  assigned_students: string[];
  meals_data: Array<{
    id: string;
    name: string;
    time: string;
    type: string;
    foods: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  duration_days: number;
  created_at: string;
  updated_at: string;
}

export const useMealPlans = () => {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealPlans = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: queryError } = await supabase
        .from('meal_plans')
        .select('*')
        .contains('assigned_students', [user.id])
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error fetching meal plans:', queryError);
        setError('Erro ao carregar planos alimentares');
        return;
      }

      setMealPlans((data || []).map(plan => ({
        ...plan,
        status: plan.status as 'active' | 'inactive' | 'draft',
        meals_data: Array.isArray(plan.meals_data) ? plan.meals_data as any[] : []
      })));
    } catch (err) {
      console.error('Error in fetchMealPlans:', err);
      setError('Erro inesperado ao carregar planos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMealPlans();
    } else {
      setLoading(false);
    }
  }, [user?.id, fetchMealPlans]);

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

  // Get active plans for current user
  const activePlans = mealPlans.filter(plan => plan.status === 'active');
  
  // Get current plan (most recent active plan)
  const currentPlan = activePlans.length > 0 ? activePlans[0] : null;

  return {
    mealPlans,
    activePlans,
    currentPlan,
    loading,
    error,
    refetch: fetchMealPlans
  };
};