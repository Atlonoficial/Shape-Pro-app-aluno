import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  getWorkoutsByUser, 
  getWorkoutSessionsByUser,
  createWorkoutSession,
  updateWorkoutSession,
  Workout,
  WorkoutSession 
} from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export const useMyWorkouts = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribeWorkouts = getWorkoutsByUser(user.uid, (workoutData) => {
      setWorkouts(workoutData);
    });

    const unsubscribeSessions = getWorkoutSessionsByUser(user.uid, (sessionData) => {
      setSessions(sessionData);
      setLoading(false);
      
      // Find active session (not ended)
      const active = sessionData.find(session => !session.endTime);
      setActiveSession(active || null);
    });

    return () => {
      unsubscribeWorkouts();
      unsubscribeSessions();
    };
  }, [user?.uid]);

  const startWorkout = async (workoutId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) throw new Error('Workout not found');

      const newSession: Omit<WorkoutSession, 'id' | 'createdAt'> = {
        workoutId,
        userId: user.uid,
        startTime: Timestamp.now(),
        exercises: workout.exercises.map(exercise => ({
          exerciseId: exercise.id,
          sets: Array(exercise.sets).fill({
            reps: 0,
            weight: exercise.weight || 0,
            completed: false
          }),
          completed: false
        }))
      };

      const sessionId = await createWorkoutSession(newSession);
      return sessionId;
    } catch (error) {
      console.error('Error starting workout:', error);
      throw error;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<WorkoutSession>) => {
    try {
      await updateWorkoutSession(sessionId, updates);
    } catch (error) {
      console.error('Error updating workout session:', error);
      throw error;
    }
  };

  const completeWorkout = async (sessionId: string, rating?: number, notes?: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      const totalDuration = session.startTime ? 
        (Date.now() - session.startTime.toMillis()) / (1000 * 60) : 0; // minutes

      await updateWorkoutSession(sessionId, {
        endTime: Timestamp.now(),
        totalDuration,
        rating,
        notes
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  };

  const getWorkoutHistory = (workoutId?: string) => {
    if (workoutId) {
      return sessions.filter(session => session.workoutId === workoutId && session.endTime);
    }
    return sessions.filter(session => session.endTime);
  };

  const getWorkoutStats = () => {
    const completedSessions = sessions.filter(session => session.endTime);
    const totalWorkouts = completedSessions.length;
    const totalTime = completedSessions.reduce((sum, session) => 
      sum + (session.totalDuration || 0), 0);
    const averageRating = completedSessions.length > 0 ?
      completedSessions.reduce((sum, session) => sum + (session.rating || 0), 0) / completedSessions.length : 0;

    return {
      totalWorkouts,
      totalTime,
      averageRating,
      currentStreak: getCurrentStreak(completedSessions),
      lastWorkout: completedSessions[0]?.startTime
    };
  };

  return {
    workouts,
    sessions,
    loading,
    activeSession,
    startWorkout,
    updateSession,
    completeWorkout,
    getWorkoutHistory,
    getWorkoutStats,
    hasActiveWorkout: !!activeSession
  };
};

// Helper function to calculate current workout streak
const getCurrentStreak = (sessions: WorkoutSession[]): number => {
  if (sessions.length === 0) return 0;

  const sortedSessions = sessions
    .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.startTime.toDate());
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else if (diffDays === streak + 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
};