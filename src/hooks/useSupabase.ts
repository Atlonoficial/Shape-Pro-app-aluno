import { useState, useEffect } from 'react';
import {
  getWorkoutsByUser,
  getNutritionPlansByUser,
  getNotificationsByUser,
  getChatMessages,
  getStudentByUserId,
  Workout,
  NutritionPlan,
  Notification,
  ChatMessage,
  Student
} from '@/lib/supabase';

export const useWorkouts = (userId: string) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

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
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = getNutritionPlansByUser(userId, (planData) => {
      setPlans(planData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { plans, loading };
};

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = getNotificationsByUser(userId, (notificationData) => {
      setNotifications(notificationData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, loading };
};

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const unsubscribe = getChatMessages(conversationId, (messageData) => {
      setMessages(messageData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading };
};

export const useStudentProfile = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Implementation will be updated when user context is available
    setLoading(false);
  }, []);

  return {
    student,
    loading,
    error,
    isActive: student?.membership_status === 'active',
    hasTeacher: !!student?.teacher_id
  };
};