import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface MealLog {
  id: string;
  user_id: string;
  meal_plan_id?: string;
  meal_plan_item_id?: string;
  meal_name?: string;
  meal_id?: string;
  nutrition_plan_id?: string;
  date: string;
  consumed: boolean;
  actual_time?: string;
  notes?: string;
  photo_url?: string;
  rating?: number;
  custom_portion_amount?: number;
  custom_portion_unit?: string;
  created_at: string;
}

export interface TodayMeal {
  meal_plan_item_id: string;
  meal_name: string;
  meal_time: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: any;
  is_logged: boolean;
  log_id?: string;
  meal_plan_id: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: Array<{
    id?: string;
    name: string;
    quantity: number;
    unit?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface DailyStats {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  target: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const useMyNutrition = () => {
  const { user } = useAuth();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState<TodayMeal[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    target: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
  });

  // Função para buscar refeições do dia usando a nova função do banco
  const getTodayMeals = useCallback(async (userId: string) => {
    try {
      console.log(`[useMyNutrition] Fetching today's meals for user ${userId}`);
      
      const { data, error } = await supabase.rpc('get_meals_for_today_v2', {
        p_user_id: userId
      });

      if (error) {
        console.error('[useMyNutrition] Error fetching today meals:', error);
        return [];
      }

      console.log(`[useMyNutrition] Successfully fetched ${data?.length || 0} meals for today`);
      return data || [];
    } catch (error) {
      console.error('[useMyNutrition] Exception in getTodayMeals:', error);
      return [];
    }
  }, []);

  // Função para buscar os logs de refeição do usuário (mantida para compatibilidade)
  const getMealLogsByUserAndDate = useCallback(async (userId: string, date: string) => {
    try {
      console.log(`[useMyNutrition] Fetching meal logs for user ${userId} on date ${date}`);
      
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', `${date}T00:00:00`)
        .lt('date', `${date}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useMyNutrition] Error fetching meal logs:', error);
        return [];
      }

      console.log(`[useMyNutrition] Successfully fetched ${data?.length || 0} meal logs`);
      return data || [];
    } catch (error) {
      console.error('[useMyNutrition] Exception in getMealLogsByUserAndDate:', error);
      return [];
    }
  }, []);

  // Buscar refeições do dia usando a nova estrutura
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[useMyNutrition] Starting data fetch for user:', user.id);
        
        // Buscar refeições do dia com status de log
        const todayMealsData = await getTodayMeals(user.id);
        setTodaysMeals(todayMealsData);
        
        // Buscar logs do dia para compatibilidade
        const today = new Date().toISOString().split('T')[0];
        const logs = await getMealLogsByUserAndDate(user.id, today);
        setMealLogs(logs);
        
        console.log('[useMyNutrition] Data fetch completed successfully');
        console.log('[useMyNutrition] Today meals:', todayMealsData);
        console.log('[useMyNutrition] Meal logs:', logs);
      } catch (error) {
        console.error('[useMyNutrition] Error in data fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, getTodayMeals, getMealLogsByUserAndDate]);

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('[useMyNutrition] Setting up real-time subscription for user:', user.id);
    
    const channel = supabase
      .channel('meal-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_logs',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('[useMyNutrition] Real-time update received:', payload);
          
          // Refetch data when changes occur
          const todayMealsData = await getTodayMeals(user.id);
          setTodaysMeals(todayMealsData);
          
          const today = new Date().toISOString().split('T')[0];
          const logs = await getMealLogsByUserAndDate(user.id, today);
          setMealLogs(logs);
        }
      )
      .subscribe();

    return () => {
      console.log('[useMyNutrition] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, getTodayMeals, getMealLogsByUserAndDate]);

  // Calcular estatísticas diárias baseadas nas refeições do dia
  useEffect(() => {
    if (!todaysMeals.length) {
      setDailyStats({
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        target: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      });
      return;
    }

    // Calcular totais alvo
    const target = todaysMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Calcular totais consumidos (apenas refeições marcadas como consumidas)
    const consumed = todaysMeals
      .filter(meal => meal.is_logged)
      .reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fat: acc.fat + (meal.fat || 0)
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

    // Calcular percentuais
    const percentage = {
      calories: target.calories > 0 ? (consumed.calories / target.calories) * 100 : 0,
      protein: target.protein > 0 ? (consumed.protein / target.protein) * 100 : 0,
      carbs: target.carbs > 0 ? (consumed.carbs / target.carbs) * 100 : 0,
      fat: target.fat > 0 ? (consumed.fat / target.fat) * 100 : 0,
    };

    setDailyStats({ consumed, target, percentage });
  }, [todaysMeals]);

  // Função para registrar uma refeição usando a nova estrutura
  const logMeal = useCallback(async (mealPlanItemId: string, consumed: boolean, notes?: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('[useMyNutrition] User ID not available for meal logging');
      return false;
    }

    try {
      console.log(`[useMyNutrition] Logging meal: ${mealPlanItemId}, consumed: ${consumed}`);

      // Buscar as refeições do dia para obter informações completas
      const todayMealsData = await getTodayMeals(user.id);
      const mealData = todayMealsData.find(meal => meal.meal_plan_item_id === mealPlanItemId);

      if (!mealData) {
        console.error('[useMyNutrition] Meal data not found for item ID:', mealPlanItemId);
        return false;
      }

      console.log('[useMyNutrition] Found meal data:', mealData);

      // Se já existe um log e está marcado como consumido, não permitir desmarcar
      if (mealData.is_logged && mealData.log_id && !consumed) {
        console.warn('[useMyNutrition] Cannot uncheck a consumed meal');
        return false;
      }

      if (mealData.log_id) {
        // Atualizar log existente
        console.log('[useMyNutrition] Updating existing meal log:', mealData.log_id);
        
        const { error } = await supabase
          .from('meal_logs')
          .update({
            consumed,
            notes,
            actual_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', mealData.log_id);

        if (error) {
          console.error('[useMyNutrition] Error updating meal log:', error);
          return false;
        }
      } else {
        // Criar novo log usando a nova estrutura
        console.log('[useMyNutrition] Creating new meal log');
        
        const mealLogData = {
          user_id: user.id,
          meal_plan_id: mealData.meal_plan_id,
          meal_plan_item_id: mealPlanItemId,
          meal_name: mealData.meal_name,
          date: new Date().toISOString(),
          consumed,
          notes,
          actual_time: new Date().toISOString()
        };

        console.log('[useMyNutrition] Meal log data to insert:', mealLogData);

        const { error } = await supabase
          .from('meal_logs')
          .insert(mealLogData);

        if (error) {
          console.error('[useMyNutrition] Error creating meal log:', error);
          return false;
        }
      }

      // Refresh data após operação
      const refreshedData = await getTodayMeals(user.id);
      setTodaysMeals(refreshedData);
      
      const today = new Date().toISOString().split('T')[0];
      const logs = await getMealLogsByUserAndDate(user.id, today);
      setMealLogs(logs);

      console.log('[useMyNutrition] Meal logging completed successfully');
      return true;
    } catch (error) {
      console.error('[useMyNutrition] Exception in logMeal:', error);
      return false;
    }
  }, [user?.id, getTodayMeals, getMealLogsByUserAndDate]);

  const addMealLog = logMeal; // Alias para compatibilidade

  // Converter todaysMeals para o formato Meal[] para compatibilidade
  const planMeals: Meal[] = todaysMeals.map(meal => ({
    id: meal.meal_plan_item_id,
    name: meal.meal_name,
    time: meal.meal_time,
    meal_type: meal.meal_type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    foods: Array.isArray(meal.foods) ? meal.foods : []
  }));

  return {
    nutritionPlans: [], // Deprecated - usar todaysMeals
    mealLogs,
    activePlan: null, // Deprecated - informações já estão em todaysMeals
    todaysMeals,
    planMeals, // Para compatibilidade
    dailyStats,
    loading,
    logMeal,
    addMealLog
  };
};