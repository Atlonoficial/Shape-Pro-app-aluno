import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useWorkoutPlans, type WorkoutPlan } from './useWorkoutPlans';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: string;
  reps: number;
  weight?: number;
  duration?: number;
  rest_time: number;
  notes?: string;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: string;
  instructions?: string;
  video_url?: string;
  image_url?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  notes?: string;
  exercises: Exercise[];
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  sessions_per_week: number;
  sessions: WorkoutSession[];
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useWorkouts = () => {
  const { user } = useAuth();
  const { currentPlan, loading: plansLoading, workoutPlans } = useWorkoutPlans();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert WorkoutPlan to Workout format for compatibility
  const convertWorkoutPlan = (plan: WorkoutPlan): Workout => {
    const sessions: WorkoutSession[] = Array.isArray(plan.exercises_data) 
      ? plan.exercises_data.map(sessionData => ({
          id: sessionData.id,
          name: sessionData.name,
          notes: sessionData.notes,
          exercises: Array.isArray(sessionData.exercises) 
            ? sessionData.exercises.map(ex => ({
                id: ex.id,
                name: ex.name,
                category: ex.category || 'general',
                sets: ex.sets || '3',
                reps: ex.reps || 12,
                weight: ex.weight,
                duration: ex.duration,
                rest_time: ex.rest_time || 60,
                notes: ex.notes,
                muscle_groups: [],
                equipment: [],
                difficulty: plan.difficulty,
                instructions: '',
                video_url: '',
                image_url: ''
              }))
            : []
        }))
      : [];

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      difficulty: plan.difficulty,
      duration_weeks: plan.duration_weeks,
      sessions_per_week: plan.sessions_per_week,
      sessions,
      tags: plan.tags,
      notes: plan.notes,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    };
  };

  // Convert workout plans to workouts format
  useEffect(() => {
    if (workoutPlans && workoutPlans.length > 0) {
      const convertedWorkouts = workoutPlans
        .filter(plan => plan.status === 'active')
        .map(convertWorkoutPlan);
      setWorkouts(convertedWorkouts);
    } else {
      setWorkouts([]);
    }
  }, [workoutPlans]);

  // Update loading state
  useEffect(() => {
    setLoading(plansLoading);
  }, [plansLoading]);

  // Get current workout (from current plan)
  const currentWorkout = currentPlan ? convertWorkoutPlan(currentPlan) : null;

  return {
    workouts,
    currentWorkout,
    loading,
    // Legacy compatibility
    user
  };
};