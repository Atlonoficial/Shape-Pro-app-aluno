// Temporary simplified hooks - all return empty data
import { useState, useEffect } from 'react';

export const useBanners = (userId?: string) => {
  return { banners: [], loading: false };
};

export const useChat = (conversationId: string) => {
  return { 
    messages: [], 
    loading: false,
    sendMessage: async () => {}
  };
};

export const useFCMTokens = () => {
  return { 
    requestPermission: async () => {},
    clearToken: async () => {}
  };
};

export const useMealLogs = () => {
  return { 
    logs: [], 
    loading: false, 
    logMeal: async () => {},
    addMealLog: async () => {}
  };
};

export const useMyData = (userId?: string) => {
  return { 
    student: null, 
    trainings: [], 
    loading: false, 
    error: null 
  };
};

export const useMyNutrition = () => {
  return { 
    nutritionPlans: [], 
    mealLogs: [], 
    activePlan: null, 
    loading: false, 
    todaysMeals: [],
    dailyStats: {
      consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      target: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
      percentage: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    },
    logMeal: async () => {}
  };
};

export const useMyTrainings = (userId?: string) => {
  return { 
    trainings: [], 
    loading: false, 
    error: null 
  };
};

export const useMyWorkouts = () => {
  return { 
    workouts: [], 
    sessions: [], 
    loading: false, 
    startWorkout: async () => {},
    completeWorkout: async () => {},
    saveWorkoutSession: async () => {}
  };
};

export const useProgressLogs = () => {
  return { 
    logs: [], 
    loading: false, 
    addProgressLog: async () => {}
  };
};

export const useStudentProfile = () => {
  return { 
    student: null, 
    loading: false, 
    error: null, 
    createStudentProfile: async () => {},
    updateProfile: async () => {},
    isActive: false, 
    hasTeacher: false 
  };
};

export const useStudents = () => {
  return { 
    createStudent: async () => {},
    updateStudent: async () => {},
    mapGoalToStandard: (goal: string) => goal, 
    loading: false, 
    error: null 
  };
};

export const useWorkoutSessions = () => {
  return { 
    sessions: [], 
    loading: false, 
    createSession: async () => {},
    updateSession: async () => {}
  };
};