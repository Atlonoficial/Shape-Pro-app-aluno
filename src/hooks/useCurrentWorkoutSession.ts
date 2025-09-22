import { useMemo } from 'react';
import { useWorkoutPlans } from './useWorkoutPlans';

export interface CurrentWorkoutSession {
  sessionName: string;
  sessionLabel: string; // "Treino A", "Treino B", etc.
  exercises: any[];
  estimatedDuration: number;
  difficulty: string;
  totalExercises: number;
  dayOfWeek: number;
  sessionIndex: number;
}

export const useCurrentWorkoutSession = () => {
  const { currentPlan, loading } = useWorkoutPlans();

  const currentSession = useMemo((): CurrentWorkoutSession | null => {
    if (!currentPlan || !currentPlan.exercises_data || currentPlan.exercises_data.length === 0) {
      return null;
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const sessionsPerWeek = currentPlan.sessions_per_week || 3;
    const totalSessions = currentPlan.exercises_data.length;

    // Calculate which session should be performed today
    // Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6, Sunday = 0
    const workoutDays = getWorkoutDays(sessionsPerWeek);
    
    // Find if today is a workout day
    const todayWorkoutIndex = workoutDays.indexOf(dayOfWeek);
    
    if (todayWorkoutIndex === -1) {
      // Today is not a workout day, get the next workout day
      const nextWorkoutDay = getNextWorkoutDay(dayOfWeek, workoutDays);
      const nextSessionIndex = workoutDays.indexOf(nextWorkoutDay) % totalSessions;
      const session = currentPlan.exercises_data[nextSessionIndex];
      
      return {
        sessionName: session?.name || `Sessão ${nextSessionIndex + 1}`,
        sessionLabel: `Treino ${String.fromCharCode(65 + nextSessionIndex)}`, // A, B, C, etc.
        exercises: session?.exercises || [],
        estimatedDuration: calculateSessionDuration(session?.exercises || []),
        difficulty: currentPlan.difficulty,
        totalExercises: session?.exercises?.length || 0,
        dayOfWeek: nextWorkoutDay,
        sessionIndex: nextSessionIndex,
      };
    }

    // Today is a workout day, get current session
    const sessionIndex = todayWorkoutIndex % totalSessions;
    const session = currentPlan.exercises_data[sessionIndex];

    return {
      sessionName: session?.name || `Sessão ${sessionIndex + 1}`,
      sessionLabel: `Treino ${String.fromCharCode(65 + sessionIndex)}`, // A, B, C, etc.
      exercises: session?.exercises || [],
      estimatedDuration: calculateSessionDuration(session?.exercises || []),
      difficulty: currentPlan.difficulty,
      totalExercises: session?.exercises?.length || 0,
      dayOfWeek,
      sessionIndex,
    };
  }, [currentPlan]);

  return {
    currentSession,
    loading,
    hasWorkoutPlan: !!currentPlan,
  };
};

// Helper function to get workout days based on sessions per week
function getWorkoutDays(sessionsPerWeek: number): number[] {
  switch (sessionsPerWeek) {
    case 2:
      return [1, 4]; // Monday, Thursday
    case 3:
      return [1, 3, 5]; // Monday, Wednesday, Friday
    case 4:
      return [1, 2, 4, 5]; // Monday, Tuesday, Thursday, Friday
    case 5:
      return [1, 2, 3, 4, 5]; // Monday to Friday
    case 6:
      return [1, 2, 3, 4, 5, 6]; // Monday to Saturday
    default:
      return [1, 3, 5]; // Default to 3x per week
  }
}

// Helper function to get next workout day
function getNextWorkoutDay(currentDay: number, workoutDays: number[]): number {
  // Find the next workout day after current day
  for (const day of workoutDays) {
    if (day > currentDay) {
      return day;
    }
  }
  // If no day after current day, return first workout day of next week
  return workoutDays[0];
}

// Helper function to calculate session duration
function calculateSessionDuration(exercises: any[]): number {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return 0;
  }

  return exercises.reduce((total, exercise) => {
    const sets = parseInt(exercise.sets) || 3;
    const restTime = exercise.rest_time || 60;
    const exerciseTime = exercise.duration || 30; // Default 30 seconds per set
    
    return total + (sets * exerciseTime) + ((sets - 1) * restTime);
  }, 0) / 60; // Convert to minutes
}