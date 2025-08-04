import { useState, useEffect } from 'react';
import {
  getWorkoutsByUser,
  getNutritionPlansByUser,
  getProgressByUser,
  getNotificationsByUser,
  Workout,
  NutritionPlan,
  ProgressEntry,
  Notification
} from '@/lib/firestore';

export const useWorkouts = (userId: string) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getWorkoutsByUser(userId, (workoutData) => {
      setWorkouts(workoutData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { workouts, loading };
};

export const useNutritionPlans = (userId: string) => {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getNutritionPlansByUser(userId, (planData) => {
      setPlans(planData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { plans, loading };
};

export const useProgress = (userId: string) => {
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getProgressByUser(userId, (progressData) => {
      setProgress(progressData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { progress, loading };
};

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getNotificationsByUser(userId, (notificationData) => {
      setNotifications(notificationData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, loading };
};