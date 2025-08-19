// Temporary simplified hooks to replace Firebase dependencies
import { useState, useEffect } from 'react';

export const useSimpleAuth = () => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    setLoading
  };
};

export const useSimpleData = (userId?: string) => {
  return {
    data: [],
    loading: false,
    error: null
  };
};

// Temporary stubs for hooks that depend on Firebase
export const useBanners = (userId?: string) => ({ banners: [], loading: false });
export const useChat = (conversationId: string) => ({ messages: [], loading: false });
export const useFCMTokens = () => ({ requestPermission: () => {}, clearToken: () => {} });
export const useMealLogs = () => ({ logs: [], loading: false, logMeal: () => {}, addMealLog: () => {} });
export const useMyData = (userId?: string) => ({ student: null, trainings: [], loading: false, error: null });
export const useMyTrainings = (userId?: string) => ({ trainings: [], loading: false, error: null });
export const useMyWorkouts = () => ({ 
  workouts: [], 
  sessions: [], 
  loading: false, 
  startWorkout: () => {}, 
  completeWorkout: () => {}, 
  saveWorkoutSession: () => {} 
});
export const useProgressLogs = () => ({ logs: [], loading: false, addProgressLog: () => {} });
export const useStudentProfile = () => ({ 
  student: null, 
  loading: false, 
  error: null, 
  createStudentProfile: () => {}, 
  updateProfile: () => {}, 
  isActive: false, 
  hasTeacher: false 
});
export const useStudents = () => ({ 
  createStudent: () => {}, 
  updateStudent: () => {}, 
  mapGoalToStandard: (goal: string) => goal, 
  loading: false, 
  error: null 
});
export const useWorkoutSessions = () => ({ 
  sessions: [], 
  loading: false, 
  createSession: () => {}, 
  updateSession: () => {} 
});