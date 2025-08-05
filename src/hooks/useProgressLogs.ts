import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  addProgressEntry,
  getProgressByUser,
  ProgressEntry 
} from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export const useProgressLogs = () => {
  const { user } = useAuth();
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = getProgressByUser(user.uid, (entries) => {
      setProgressEntries(entries);
      setLoading(false);
      console.log('Progress entries loaded:', entries.length);
    });

    return unsubscribe;
  }, [user?.uid]);

  const logProgress = async (
    type: 'workout' | 'weight' | 'meal' | 'measurement',
    value: number,
    unit: string,
    notes?: string,
    workoutId?: string,
    mealId?: string,
    date?: Date
  ) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const newEntry: Omit<ProgressEntry, 'id'> = {
        userId: user.uid,
        type,
        value,
        unit,
        notes,
        workoutId,
        mealId,
        date: date ? Timestamp.fromDate(date) : Timestamp.now()
      };

      const entryId = await addProgressEntry(newEntry);
      console.log('Progress logged:', entryId, type, value, unit);
      return entryId;
    } catch (error) {
      console.error('Error logging progress:', error);
      throw error;
    }
  };

  const logWeight = async (weight: number, notes?: string, date?: Date) => {
    return logProgress('weight', weight, 'kg', notes, undefined, undefined, date);
  };

  const logMeasurement = async (value: number, unit: string, notes?: string, date?: Date) => {
    return logProgress('measurement', value, unit, notes, undefined, undefined, date);
  };

  const logWorkoutProgress = async (value: number, unit: string, workoutId: string, notes?: string, date?: Date) => {
    return logProgress('workout', value, unit, notes, workoutId, undefined, date);
  };

  const getProgressByType = (type: ProgressEntry['type']) => {
    return progressEntries.filter(entry => entry.type === type);
  };

  const getWeightHistory = () => {
    return progressEntries
      .filter(entry => entry.type === 'weight')
      .sort((a, b) => a.date.toMillis() - b.date.toMillis());
  };

  const getMeasurementHistory = (unit?: string) => {
    let measurements = progressEntries.filter(entry => entry.type === 'measurement');
    
    if (unit) {
      measurements = measurements.filter(entry => entry.unit === unit);
    }

    return measurements.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  };

  const getWorkoutProgress = (workoutId?: string) => {
    let workouts = progressEntries.filter(entry => entry.type === 'workout');
    
    if (workoutId) {
      workouts = workouts.filter(entry => entry.workoutId === workoutId);
    }

    return workouts.sort((a, b) => b.date.toMillis() - a.date.toMillis());
  };

  const getLatestWeight = () => {
    const weightEntries = getWeightHistory();
    return weightEntries.length > 0 ? weightEntries[weightEntries.length - 1] : null;
  };

  const getWeightTrend = (days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentWeights = progressEntries
      .filter(entry => 
        entry.type === 'weight' && 
        entry.date.toDate() >= cutoffDate
      )
      .sort((a, b) => a.date.toMillis() - b.date.toMillis());

    if (recentWeights.length < 2) return 0;

    const firstWeight = recentWeights[0].value;
    const lastWeight = recentWeights[recentWeights.length - 1].value;
    
    return lastWeight - firstWeight;
  };

  const getProgressStats = () => {
    const totalEntries = progressEntries.length;
    const weightEntries = getProgressByType('weight');
    const measurementEntries = getProgressByType('measurement');
    const workoutEntries = getProgressByType('workout');

    return {
      totalEntries,
      weightLogs: weightEntries.length,
      measurementLogs: measurementEntries.length,
      workoutLogs: workoutEntries.length,
      latestWeight: getLatestWeight(),
      weightTrend: getWeightTrend(),
      lastEntry: progressEntries[0]?.date
    };
  };

  return {
    progressEntries,
    loading,
    logProgress,
    logWeight,
    logMeasurement,
    logWorkoutProgress,
    getProgressByType,
    getWeightHistory,
    getMeasurementHistory,
    getWorkoutProgress,
    getLatestWeight,
    getWeightTrend,
    getProgressStats,
    progressStats: getProgressStats()
  };
};