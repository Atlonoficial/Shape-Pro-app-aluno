import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Workout interfaces
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restTime: number;
  instructions: string;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  duration: number;
  calories: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroup: string;
  assignedTo: string[]; // user IDs
  createdBy: string; // teacher ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Nutrition interfaces
export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface NutritionPlan {
  id: string;
  name: string;
  description: string;
  meals: Meal[];
  totalCalories: number;
  assignedTo: string[]; // user IDs
  createdBy: string; // teacher ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Progress tracking
export interface ProgressEntry {
  id: string;
  userId: string;
  workoutId?: string;
  mealId?: string;
  type: 'workout' | 'weight' | 'meal' | 'measurement';
  value: number;
  unit: string;
  notes?: string;
  date: Timestamp;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'meal' | 'reminder' | 'achievement' | 'general';
  targetUsers: string[];
  isRead: boolean;
  createdAt: Timestamp;
  scheduledFor?: Timestamp;
}

// Workout CRUD operations
export const createWorkout = async (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'workouts'), {
      ...workout,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

export const getWorkoutsByUser = (userId: string, callback: (workouts: Workout[]) => void) => {
  const q = query(
    collection(db, 'workouts'),
    where('assignedTo', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const workouts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Workout));
    callback(workouts);
  });
};

// Nutrition CRUD operations
export const createNutritionPlan = async (plan: Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'nutrition'), {
      ...plan,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    throw error;
  }
};

export const getNutritionPlansByUser = (userId: string, callback: (plans: NutritionPlan[]) => void) => {
  const q = query(
    collection(db, 'nutrition'),
    where('assignedTo', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NutritionPlan));
    callback(plans);
  });
};

// Progress tracking
export const addProgressEntry = async (entry: Omit<ProgressEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'progress'), entry);
    return docRef.id;
  } catch (error) {
    console.error('Error adding progress entry:', error);
    throw error;
  }
};

export const getProgressByUser = (userId: string, callback: (progress: ProgressEntry[]) => void) => {
  const q = query(
    collection(db, 'progress'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const progress = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProgressEntry));
    callback(progress);
  });
};

// Notifications
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotificationsByUser = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetUsers', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};