import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  createWorkoutSession,
  updateWorkoutSession,
  getWorkoutSessionsByUser,
  WorkoutSession 
} from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export const useWorkoutSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = getWorkoutSessionsByUser(user.uid, (sessionData) => {
      setSessions(sessionData);
      setLoading(false);
      
      // Find active session (not ended)
      const active = sessionData.find(session => !session.endTime);
      setActiveSession(active || null);
      
      console.log('Workout sessions loaded:', sessionData.length);
    });

    return unsubscribe;
  }, [user?.uid]);

  const startSession = async (
    workoutId: string, 
    exercises: { exerciseId: string; sets: number; reps: number; weight?: number }[]
  ) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const newSession: Omit<WorkoutSession, 'id' | 'createdAt'> = {
        workoutId,
        userId: user.uid,
        startTime: Timestamp.now(),
        exercises: exercises.map(exercise => ({
          exerciseId: exercise.exerciseId,
          sets: Array(exercise.sets).fill({
            reps: exercise.reps,
            weight: exercise.weight || 0,
            completed: false
          }),
          completed: false
        }))
      };

      const sessionId = await createWorkoutSession(newSession);
      console.log('Workout session started:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error starting workout session:', error);
      throw error;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<WorkoutSession>) => {
    try {
      await updateWorkoutSession(sessionId, updates);
      console.log('Workout session updated:', sessionId);
    } catch (error) {
      console.error('Error updating workout session:', error);
      throw error;
    }
  };

  const completeSession = async (
    sessionId: string, 
    rating?: number, 
    notes?: string,
    caloriesBurned?: number
  ) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      const totalDuration = session.startTime ? 
        (Date.now() - session.startTime.toMillis()) / (1000 * 60) : 0; // minutes

      await updateWorkoutSession(sessionId, {
        endTime: Timestamp.now(),
        totalDuration,
        rating,
        notes,
        caloriesBurned
      });

      console.log('Workout session completed:', sessionId);
    } catch (error) {
      console.error('Error completing workout session:', error);
      throw error;
    }
  };

  const getSessionHistory = (workoutId?: string) => {
    if (workoutId) {
      return sessions.filter(session => session.workoutId === workoutId && session.endTime);
    }
    return sessions.filter(session => session.endTime);
  };

  const getSessionStats = () => {
    const completedSessions = sessions.filter(session => session.endTime);
    const totalSessions = completedSessions.length;
    const totalTime = completedSessions.reduce((sum, session) => 
      sum + (session.totalDuration || 0), 0);
    const totalCalories = completedSessions.reduce((sum, session) => 
      sum + (session.caloriesBurned || 0), 0);
    const averageRating = completedSessions.length > 0 ?
      completedSessions.reduce((sum, session) => sum + (session.rating || 0), 0) / completedSessions.length : 0;

    return {
      totalSessions,
      totalTime,
      totalCalories,
      averageRating,
      lastSession: completedSessions[0]?.startTime
    };
  };

  return {
    sessions,
    loading,
    activeSession,
    startSession,
    updateSession,
    completeSession,
    getSessionHistory,
    getSessionStats,
    hasActiveSession: !!activeSession
  };
};