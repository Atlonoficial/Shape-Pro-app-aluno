import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  getNutritionPlansByUser,
  getMealLogsByUser,
  createMealLog,
  NutritionPlan,
  MealLog 
} from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export const useMyNutrition = () => {
  const { user } = useAuth();
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribePlans = getNutritionPlansByUser(user.uid, (planData) => {
      setNutritionPlans(planData);
    });

    const unsubscribeLogs = getMealLogsByUser(user.uid, (logData) => {
      setMealLogs(logData);
      setLoading(false);
    });

    return () => {
      unsubscribePlans();
      unsubscribeLogs();
    };
  }, [user?.uid]);

  const logMeal = async (mealId: string, nutritionPlanId: string, consumed: boolean = true, photoUrl?: string, notes?: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const newLog: Omit<MealLog, 'id' | 'createdAt'> = {
        userId: user.uid,
        mealId,
        nutritionPlanId,
        date: Timestamp.now(),
        consumed,
        actualTime: new Date().toTimeString().slice(0, 5),
        photoUrl,
        notes
      };

      const logId = await createMealLog(newLog);
      return logId;
    } catch (error) {
      console.error('Error logging meal:', error);
      throw error;
    }
  };

  const getTodaysMeals = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return mealLogs.filter(log => {
      const logDate = log.date.toDate();
      return logDate >= today && logDate < tomorrow;
    });
  };

  const getDailyNutritionStats = (date?: Date) => {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayLogs = mealLogs.filter(log => {
      const logDate = log.date.toDate();
      return logDate >= targetDate && logDate < nextDay && log.consumed;
    });

    // Get current nutrition plan
    const activePlan = nutritionPlans.find(plan => {
      if (!plan.startDate || !plan.endDate) return false;
      const planStart = plan.startDate.toDate();
      const planEnd = plan.endDate.toDate();
      return targetDate >= planStart && targetDate <= planEnd;
    }) || nutritionPlans[0]; // Fallback to first plan

    if (!activePlan) {
      return {
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        target: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      };
    }

    const consumed = dayLogs.reduce((total, log) => {
      const meal = activePlan.meals.find(m => m.id === log.mealId);
      if (!meal) return total;

      return {
        calories: total.calories + meal.calories,
        protein: total.protein + meal.protein,
        carbs: total.carbs + meal.carbs,
        fat: total.fat + meal.fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const target = activePlan.dailyTargets;

    const percentage = {
      calories: target.calories > 0 ? (consumed.calories / target.calories) * 100 : 0,
      protein: target.protein > 0 ? (consumed.protein / target.protein) * 100 : 0,
      carbs: target.carbs > 0 ? (consumed.carbs / target.carbs) * 100 : 0,
      fat: target.fat > 0 ? (consumed.fat / target.fat) * 100 : 0
    };

    return { consumed, target, percentage };
  };

  const getWeeklyAdherence = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekLogs = mealLogs.filter(log => {
      const logDate = log.date.toDate();
      return logDate >= weekStart && logDate < weekEnd;
    });

    const activePlan = nutritionPlans[0]; // Current active plan
    if (!activePlan) return 0;

    const totalMealsInPlan = activePlan.meals.length * 7; // Assuming daily repetition
    const loggedMeals = weekLogs.filter(log => log.consumed).length;

    return totalMealsInPlan > 0 ? (loggedMeals / totalMealsInPlan) * 100 : 0;
  };

  const getMealHistory = (mealId: string) => {
    return mealLogs
      .filter(log => log.mealId === mealId)
      .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  };

  return {
    nutritionPlans,
    mealLogs,
    loading,
    activePlan: nutritionPlans[0] || null,
    logMeal,
    getTodaysMeals,
    getDailyNutritionStats,
    getWeeklyAdherence,
    getMealHistory,
    todaysMeals: getTodaysMeals(),
    dailyStats: getDailyNutritionStats()
  };
};