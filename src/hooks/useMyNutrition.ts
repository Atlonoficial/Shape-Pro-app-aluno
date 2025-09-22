import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getMealLogsByUserAndDate, createMealLog } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useMealPlans, type MealPlan } from './useMealPlans';

export interface MealLog {
  id: string;
  user_id: string;
  nutrition_plan_id: string;
  meal_id: string;
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
  const { currentPlan, loading: plansLoading } = useMealPlans();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState<MealLog[]>([]);
  const [planMeals, setPlanMeals] = useState<Meal[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    target: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
  });

  // Função para buscar logs de refeições de hoje
  const fetchTodayMealLogs = () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    getMealLogsByUserAndDate(user.id, today, (logs) => {
      setMealLogs(logs);
      setTodaysMeals(logs);
    });
  };

  // Função para processar refeições do meal plan
  const processPlanMeals = (mealPlan: MealPlan) => {
    if (!mealPlan?.meals_data || !Array.isArray(mealPlan.meals_data)) {
      setPlanMeals([]);
      return;
    }

    const meals: Meal[] = mealPlan.meals_data.map(mealData => ({
      id: mealData.id,
      name: mealData.name,
      time: mealData.time || '12:00',
      meal_type: mealData.type || 'meal',
      calories: mealData.foods?.reduce((total, food) => total + (food.calories || 0), 0) || 0,
      protein: mealData.foods?.reduce((total, food) => total + (food.protein || 0), 0) || 0,
      carbs: mealData.foods?.reduce((total, food) => total + (food.carbs || 0), 0) || 0,
      fat: mealData.foods?.reduce((total, food) => total + (food.fat || 0), 0) || 0,
      foods: Array.isArray(mealData.foods) ? mealData.foods.map(food => ({
        id: food.id,
        name: food.name || 'Alimento',
        quantity: food.quantity || 100,
        unit: food.unit || 'g',
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0
      })) : []
    }));

    setPlanMeals(meals);
  };

  // Process meal plan when currentPlan changes
  useEffect(() => {
    if (currentPlan) {
      processPlanMeals(currentPlan);
    } else {
      setPlanMeals([]);
    }
  }, [currentPlan]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let logsUnsubscribe: (() => void) | undefined;
    let realtimeChannel: any;

    // Buscar logs de refeições de hoje
    const today = new Date().toISOString().split('T')[0];
    logsUnsubscribe = getMealLogsByUserAndDate(user.id, today, (logs) => {
      setMealLogs(logs);
      setTodaysMeals(logs);
    });

    // Real-time subscription para meal_logs
    realtimeChannel = supabase
      .channel('meal_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Meal log realtime update:', payload);
          // Recarregar logs quando houver mudanças
          getMealLogsByUserAndDate(user.id, today, (logs) => {
            setMealLogs(logs);
            setTodaysMeals(logs);
          });
        }
      )
      .subscribe();

    return () => {
      if (logsUnsubscribe) logsUnsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Update loading state based on both plan loading and internal loading
  useEffect(() => {
    setLoading(plansLoading);
  }, [plansLoading]);

  // Calcular estatísticas diárias
  useEffect(() => {
    if (!currentPlan) {
      setDailyStats({
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        target: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      });
      return;
    }

    const target = {
      calories: currentPlan.total_calories || 0,
      protein: currentPlan.total_protein || 0,
      carbs: currentPlan.total_carbs || 0,
      fat: currentPlan.total_fat || 0,
    };

    // Calcular consumido baseado nos logs de hoje
    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    todaysMeals.forEach(log => {
      if (log.consumed) {
        // Encontrar a refeição nas refeições do plano
        const meal = planMeals.find(m => m.id === log.meal_id);
        if (meal) {
          consumed.calories += meal.calories || 0;
          consumed.protein += meal.protein || 0;
          consumed.carbs += meal.carbs || 0;
          consumed.fat += meal.fat || 0;
        }
      }
    });

    const percentage = {
      calories: target.calories > 0 ? (consumed.calories / target.calories) * 100 : 0,
      protein: target.protein > 0 ? (consumed.protein / target.protein) * 100 : 0,
      carbs: target.carbs > 0 ? (consumed.carbs / target.carbs) * 100 : 0,
      fat: target.fat > 0 ? (consumed.fat / target.fat) * 100 : 0,
    };

    setDailyStats({ consumed, target, percentage });
  }, [currentPlan, todaysMeals, planMeals]);

  const logMeal = async (mealId: string, consumed: boolean = true, notes?: string): Promise<boolean> => {
    if (!user?.id || !currentPlan) {
      console.error('Usuário não autenticado ou plano não encontrado');
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Verificar se já existe log para esta refeição hoje
      const existingLog = todaysMeals.find(log => 
        log.meal_id === mealId && 
        log.date.split('T')[0] === today
      );

      // Se já existe um log consumido e está tentando desmarcar, impedir
      if (existingLog && existingLog.consumed && consumed === false) {
        console.warn('Cannot uncheck consumed meal - only allowed once per day');
        return false;
      }

      if (existingLog) {
        // Se já está consumido e está tentando marcar novamente, retornar sucesso
        if (existingLog.consumed && consumed) {
          return true;
        }
        
        // Atualizar log existente via supabase
        const { error } = await supabase
          .from('meal_logs')
          .update({ consumed, notes })
          .eq('id', existingLog.id);
          
        if (error) {
          console.error('Erro ao atualizar meal log:', error);
          return false;
        }
      } else {
        // Criar novo log apenas se está marcando como consumido
        if (!consumed) {
          return false;
        }
        
        await createMealLog({
          user_id: user.id,
          nutrition_plan_id: currentPlan.id,
          meal_id: mealId,
          date: new Date().toISOString(),
          consumed,
          notes,
          actual_time: new Date().toTimeString().split(' ')[0]
        });
      }
      
      // Refresh the meal logs to update the UI
      fetchTodayMealLogs();
      return true;
    } catch (error) {
      console.error('Erro ao registrar refeição:', error);
      return false;
    }
  };

  const addMealLog = logMeal; // Alias para compatibilidade

  return {
    nutritionPlans: currentPlan ? [currentPlan] : [], // Compatibility
    mealLogs,
    activePlan: currentPlan, // Compatibility
    todaysMeals,
    planMeals,
    dailyStats,
    loading,
    logMeal,
    addMealLog
  };
};