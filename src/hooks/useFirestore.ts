import { useState, useEffect } from 'react';
import {
  getWorkoutsByUser,
  getNutritionPlansByUser,
  getProgressByUser,
  getNotificationsByUser,
  getCoursesByUser,
  getAppointmentsByUser,
  getPaymentsByUser,
  getChatMessages,
  Workout,
  NutritionPlan,
  ProgressEntry,
  Notification,
  Course,
  Appointment,
  Payment,
  ChatMessage
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

export const useCourses = (userId: string) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getCoursesByUser(userId, (courseData) => {
      setCourses(courseData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { courses, loading };
};

export const useAppointments = (userId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getAppointmentsByUser(userId, (appointmentData) => {
      setAppointments(appointmentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { appointments, loading };
};

export const usePayments = (userId: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getPaymentsByUser(userId, (paymentData) => {
      setPayments(paymentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { payments, loading };
};

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = getChatMessages(conversationId, (messageData) => {
      setMessages(messageData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading };
};