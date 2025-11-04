import { useState, useEffect, useCallback, useRef } from 'react';
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

  // ✅ BUILD 53: Cache de 1 minuto
  const mealsCacheRef = useRef<{ data: TodayMeal[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 60000; // 1 minuto

  // ✅ BUILD 53: Função otimizada com timeout, fallback e cache
  const getTodayMeals = useCallback(async (userId: string, forceRefresh = false) => {
    // ✅ BUILD 53: Usar cache se ainda válido
    if (!forceRefresh && mealsCacheRef.current && Date.now() - mealsCacheRef.current.timestamp < CACHE_DURATION) {
      return mealsCacheRef.current.data;
    }

    try {
      // ✅ Timeout de 5s para RPC
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('RPC Timeout')), 5000)
      );

      const queryPromise = supabase.rpc('get_meals_for_today_v2', {
        p_user_id: userId
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) throw error;
      
      // ✅ BUILD 53: Atualizar cache
      const meals = data || [];
      mealsCacheRef.current = { data: meals, timestamp: Date.now() };
      return meals;
    } catch (error) {
      // ✅ BUILD 53: Fallback com query corrigida
      try {
        const { data: allPlans } = await supabase
          .from('meal_plans')
          .select(`id, name, total_calories, meals_data, created_by, assigned_students`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10);

        // ✅ BUILD 53: Filtrar no client-side
        const userPlan = (allPlans || []).find(plan =>
          plan.created_by === userId ||
          (Array.isArray(plan.assigned_students) && plan.assigned_students.includes(userId))
        );

        if (!userPlan?.meals_data) {
          mealsCacheRef.current = { data: [], timestamp: Date.now() };
          return [];
        }

        // ✅ Transformar meals_data para formato TodayMeal com type casting
        const meals: TodayMeal[] = Array.isArray(userPlan.meals_data) 
          ? userPlan.meals_data.map((item: any): TodayMeal => ({
              meal_plan_item_id: item.meal_id || item.id,
              meal_name: item.meal_name || item.name || 'Refeição',
              meal_time: item.meal_time || '12:00',
              meal_type: item.meal_type || 'almoço',
              calories: item.calories || 0,
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fat: item.fat || 0,
              foods: item.foods || [],
              is_logged: false,
              log_id: undefined,
              meal_plan_id: userPlan.id
            }))
          : [];

        // ✅ BUILD 53: Atualizar cache
        mealsCacheRef.current = { data: meals, timestamp: Date.now() };
        return meals;
      } catch (fallbackError) {
        mealsCacheRef.current = { data: [], timestamp: Date.now() };
        return [];
      }
    }
  }, []);

  // ✅ BUILD 52: Função simplificada sem console.log
  const getMealLogsByUserAndDate = useCallback(async (userId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', `${date}T00:00:00`)
        .lt('date', `${date}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  }, []);

  // ✅ BUILD 52: Buscar refeições sem logs excessivos
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const todayMealsData = await getTodayMeals(user.id);
      setTodaysMeals(todayMealsData);
      
      const today = new Date().toISOString().split('T')[0];
      const logs = await getMealLogsByUserAndDate(user.id, today);
      setMealLogs(logs);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [user?.id, getTodayMeals, getMealLogsByUserAndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

  // Função auxiliar para calcular valores nutricionais de uma refeição
  const calculateMealNutrition = useCallback((meal: TodayMeal) => {
    // Se a refeição já tem valores nutricionais não-zero, usar eles
    if (meal.calories > 0 || meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) {
      return {
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0
      };
    }

    // Se não, calcular a partir dos alimentos individuais
    let foods = [];
    try {
      foods = Array.isArray(meal.foods) ? meal.foods : 
              (meal.foods && typeof meal.foods === 'object') ? 
              (meal.foods.foods || []) : [];
    } catch (e) {
      foods = [];
    }

    if (!foods.length) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return foods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fat: acc.fat + (food.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, []);

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

    // Calcular totais alvo usando valores corretos
    const target = todaysMeals.reduce(
      (acc, meal) => {
        const mealNutrition = calculateMealNutrition(meal);
        return {
          calories: acc.calories + mealNutrition.calories,
          protein: acc.protein + mealNutrition.protein,
          carbs: acc.carbs + mealNutrition.carbs,
          fat: acc.fat + mealNutrition.fat
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Calcular totais consumidos (apenas refeições marcadas como consumidas)
    const consumed = todaysMeals
      .filter(meal => meal.is_logged)
      .reduce(
        (acc, meal) => {
          const mealNutrition = calculateMealNutrition(meal);
          return {
            calories: acc.calories + mealNutrition.calories,
            protein: acc.protein + mealNutrition.protein,
            carbs: acc.carbs + mealNutrition.carbs,
            fat: acc.fat + mealNutrition.fat
          };
        },
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
  }, [todaysMeals, calculateMealNutrition]);

  // ✅ BUILD 52: Função simplificada sem logs excessivos
  const logMeal = useCallback(async (mealPlanItemId: string, consumed: boolean, notes?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const todayMealsData = await getTodayMeals(user.id);
      const mealData = todayMealsData.find(meal => meal.meal_plan_item_id === mealPlanItemId);

      if (!mealData) return false;

      // Se já existe um log e está marcado como consumido, não permitir desmarcar
      if (mealData.is_logged && mealData.log_id && !consumed) return false;

      if (mealData.log_id) {
        // Atualizar log existente
        const { error } = await supabase
          .from('meal_logs')
          .update({
            consumed,
            notes,
            actual_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', mealData.log_id);

        if (error) return false;
      } else {
        // Criar novo log
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

        const { error } = await supabase
          .from('meal_logs')
          .insert(mealLogData);

        if (error) return false;
      }

      // Refresh data após operação
      const refreshedData = await getTodayMeals(user.id);
      setTodaysMeals(refreshedData);
      
      const today = new Date().toISOString().split('T')[0];
      const logs = await getMealLogsByUserAndDate(user.id, today);
      setMealLogs(logs);

      return true;
    } catch (error) {
      return false;
    }
  }, [user?.id, getTodayMeals, getMealLogsByUserAndDate]);

  const addMealLog = logMeal; // Alias para compatibilidade

  return {
    nutritionPlans: [], // Deprecated - usar todaysMeals
    mealLogs,
    // CORRIGIDO: Retornar activePlan baseado nas refeições disponíveis
    activePlan: todaysMeals.length > 0 ? { 
      id: todaysMeals[0]?.meal_plan_id || 'active-plan',
      name: 'Plano Nutricional Ativo',
      meals: todaysMeals.length 
    } : null,
    todaysMeals,
    planMeals: todaysMeals.map(meal => {
      const nutrition = calculateMealNutrition(meal);
      return {
        id: meal.meal_plan_item_id,
        name: meal.meal_name,
        time: meal.meal_time,
        meal_type: meal.meal_type,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        foods: Array.isArray(meal.foods) ? meal.foods : []
      };
    }), // Para compatibilidade
    dailyStats,
    loading,
    logMeal,
    addMealLog,
    // Função adicional para verificar se tem acesso nutricional
    hasNutritionAccess: () => todaysMeals.length > 0
  };
};