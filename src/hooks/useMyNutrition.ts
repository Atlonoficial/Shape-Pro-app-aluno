import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getNutritionPlansByUser, getMealLogsByUserAndDate, createMealLog } from '@/lib/supabase';
import { NutritionPlan } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';

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
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
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
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<NutritionPlan | null>(null);
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

  // Função para buscar refeições do plano
  const fetchPlanMeals = async (mealIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name, time, meal_type, calories, protein, carbs, fat, foods')
        .in('id', mealIds)
        .order('time');
        
      if (error) {
        console.error('Erro ao buscar refeições:', error);
        return;
      }
      
      // Mapear dados para o formato correto
      const meals: Meal[] = (data || []).map(meal => ({
        id: meal.id,
        name: meal.name,
        time: meal.time || '12:00',
        meal_type: meal.meal_type,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        foods: Array.isArray(meal.foods) ? meal.foods.map((food: any) => ({
          id: food.id,
          name: food.name || 'Alimento',
          quantity: food.quantity || 100,
          calories: food.calories || 0,
          proteins: food.proteins || 0,
          carbs: food.carbs || 0,
          fats: food.fats || 0
        })) : []
      }));
      
      setPlanMeals(meals);
    } catch (error) {
      console.error('Erro ao buscar refeições:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let plansUnsubscribe: (() => void) | undefined;
    let logsUnsubscribe: (() => void) | undefined;
    let realtimeChannel: any;

    // Buscar planos de nutrição
    plansUnsubscribe = getNutritionPlansByUser(user.id, async (plans) => {
      setNutritionPlans(plans);
      // Selecionar o primeiro plano ativo como plano atual
      const currentPlan = plans.find(plan => 
        (!plan.end_date || new Date(plan.end_date) >= new Date()) &&
        (!plan.start_date || new Date(plan.start_date) <= new Date())
      ) || plans[0] || null;
      setActivePlan(currentPlan);
      
      // Buscar refeições do plano ativo usando os novos meal_ids
      if (currentPlan && (currentPlan as any).meal_ids) {
        const mealIds = Array.isArray((currentPlan as any).meal_ids) 
          ? (currentPlan as any).meal_ids 
          : [];
        if (mealIds.length > 0) {
          await fetchPlanMeals(mealIds);
        }
      }
      
      setLoading(false);
    });

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
      if (plansUnsubscribe) plansUnsubscribe();
      if (logsUnsubscribe) logsUnsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Calcular estatísticas diárias
  useEffect(() => {
    if (!activePlan) {
      setDailyStats({
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        target: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      });
      return;
    }

    const target = {
      calories: activePlan.daily_calories || 0,
      protein: activePlan.daily_protein || 0,
      carbs: activePlan.daily_carbs || 0,
      fat: activePlan.daily_fat || 0,
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
  }, [activePlan, todaysMeals, planMeals]);

  const logMeal = async (mealId: string, consumed: boolean = true, notes?: string): Promise<boolean> => {
    if (!user?.id || !activePlan) {
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
          nutrition_plan_id: activePlan.id,
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
    nutritionPlans,
    mealLogs,
    activePlan,
    todaysMeals,
    planMeals,
    dailyStats,
    loading,
    logMeal,
    addMealLog
  };
};