import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  createMealLog,
  getMealLogsByUser,
  MealLog 
} from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export const useMealLogs = () => {
  const { user } = useAuth();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = getMealLogsByUser(user.uid, (logs) => {
      setMealLogs(logs);
      setLoading(false);
      console.log('Meal logs loaded:', logs.length);
    });

    return unsubscribe;
  }, [user?.uid]);

  const logMeal = async (
    mealId: string,
    nutritionPlanId: string,
    consumed: boolean = true,
    rating?: number,
    notes?: string,
    photoUrl?: string,
    actualTime?: string,
    customPortions?: { amount: number; unit: string }
  ) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const newLog: Omit<MealLog, 'id' | 'createdAt'> = {
        userId: user.uid,
        mealId,
        nutritionPlanId,
        date: Timestamp.now(),
        consumed,
        rating,
        notes,
        photoUrl,
        actualTime,
        customPortions
      };

      const logId = await createMealLog(newLog);
      console.log('Meal logged:', logId);
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

  const getMealsByDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return mealLogs.filter(log => {
      const logDate = log.date.toDate();
      return logDate >= targetDate && logDate < nextDay;
    });
  };

  const getMealHistory = (mealId: string) => {
    return mealLogs
      .filter(log => log.mealId === mealId)
      .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  };

  const getWeeklyAdherence = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyLogs = mealLogs.filter(log => 
      log.date.toDate() >= oneWeekAgo && log.consumed
    );

    // Assuming 3 meals per day (21 meals per week)
    const expectedMeals = 21;
    return weeklyLogs.length > 0 ? (weeklyLogs.length / expectedMeals) * 100 : 0;
  };

  const getDailyCalories = (date?: Date) => {
    const targetDate = date || new Date();
    const mealsToday = getMealsByDate(targetDate);
    
    // This would need to be enhanced with actual meal calorie data
    // For now, returning a basic calculation
    return mealsToday.filter(log => log.consumed).length * 400; // rough estimate
  };

  const getMealStats = () => {
    const totalMeals = mealLogs.filter(log => log.consumed).length;
    const mealsWithRating = mealLogs.filter(log => log.consumed && log.rating);
    const averageRating = mealsWithRating.length > 0 ?
      mealsWithRating.reduce((sum, log) => sum + (log.rating || 0), 0) / mealsWithRating.length : 0;

    return {
      totalMeals,
      averageRating,
      weeklyAdherence: getWeeklyAdherence(),
      todaysMeals: getTodaysMeals().length,
      lastMeal: mealLogs[0]?.date
    };
  };

  return {
    mealLogs,
    loading,
    logMeal,
    getTodaysMeals,
    getMealsByDate,
    getMealHistory,
    getWeeklyAdherence,
    getDailyCalories,
    getMealStats,
    todaysMeals: getTodaysMeals(),
    mealStats: getMealStats()
  };
};