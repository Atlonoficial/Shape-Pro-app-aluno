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

// Student profile interfaces
export interface Student {
  id: string;
  userId: string; // Reference to auth.users
  teacherId: string; // Professor atribuído
  activePlan?: string; // Plano ativo
  goals: string[];
  measurements: {
    weight: number;
    height: number;
    bodyFat?: number;
    muscleMass?: number;
    lastUpdated: Timestamp;
  };
  preferences: {
    notifications: boolean;
    language: string;
    timezone: string;
  };
  membershipStatus: 'active' | 'suspended' | 'expired';
  membershipExpiry?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  muscleGroup: string;
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  exercises: {
    exerciseId: string;
    sets: {
      reps: number;
      weight?: number;
      duration?: number;
      completed: boolean;
      restTime?: number;
    }[];
    completed: boolean;
    notes?: string;
  }[];
  totalDuration?: number;
  caloriesBurned?: number;
  rating?: number; // 1-5
  notes?: string;
  createdAt: Timestamp;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedDuration: number;
  estimatedCalories: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  tags: string[];
  assignedTo: string[]; // user IDs
  createdBy: string; // teacher ID
  isTemplate: boolean;
  templateCategory?: string;
  sessions?: number; // Número de sessões completadas
  lastCompleted?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Nutrition interfaces
export interface Meal {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  time: string; // "08:00"
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients?: string[];
  instructions?: string;
  imageUrl?: string;
  portion?: {
    amount: number;
    unit: string;
  };
}

export interface MealLog {
  id: string;
  userId: string;
  mealId: string;
  nutritionPlanId: string;
  date: Timestamp;
  consumed: boolean;
  actualTime?: string;
  rating?: number; // 1-5
  notes?: string;
  photoUrl?: string;
  customPortions?: {
    amount: number;
    unit: string;
  };
  createdAt: Timestamp;
}

export interface NutritionPlan {
  id: string;
  name: string;
  description: string;
  meals: Meal[];
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    water?: number; // ml
  };
  weeklySchedule?: {
    [key: string]: string[]; // day: mealIds
  };
  assignedTo: string[]; // user IDs
  createdBy: string; // teacher ID
  isTemplate: boolean;
  tags: string[];
  duration?: number; // days
  startDate?: Timestamp;
  endDate?: Timestamp;
  adherenceRate?: number; // percentage
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

// Course interfaces
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total minutes
  price: number;
  modules: CourseModule[];
  instructor: string; // teacher ID
  tags: string[];
  publishedAt?: Timestamp;
  isPublished: boolean;
  enrolledUsers: string[]; // user IDs
  rating?: number;
  reviews?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // minutes
  order: number;
  isPreview: boolean;
  resources?: {
    title: string;
    url: string;
    type: 'pdf' | 'link' | 'download';
  }[];
}

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  moduleProgress: {
    moduleId: string;
    completed: boolean;
    watchTime: number; // seconds
    completedAt?: Timestamp;
  }[];
  overallProgress: number; // percentage
  enrolledAt: Timestamp;
  lastAccessed: Timestamp;
  certificateIssued?: boolean;
  certificateUrl?: string;
}

// Appointment interfaces
export interface Appointment {
  id: string;
  studentId: string;
  teacherId: string;
  title: string;
  description: string;
  type: 'consultation' | 'assessment' | 'follow-up' | 'nutrition' | 'training';
  scheduledTime: Timestamp;
  duration: number; // minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string; // física ou "online"
  meetingLink?: string;
  notes?: string;
  attachments?: string[]; // URLs
  price?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  reminderSent: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Chat interfaces
export interface ChatMessage {
  id: string;
  conversationId: string; // studentId-teacherId
  senderId: string;
  senderType: 'student' | 'teacher';
  message: string;
  messageType: 'text' | 'image' | 'file' | 'audio';
  attachments?: {
    url: string;
    type: string;
    name: string;
    size?: number;
  }[];
  replyTo?: string; // message ID
  isRead: boolean;
  readAt?: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface Conversation {
  id: string; // studentId-teacherId
  studentId: string;
  teacherId: string;
  lastMessage?: string;
  lastMessageAt: Timestamp;
  unreadCount: {
    student: number;
    teacher: number;
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payment interfaces
export interface Payment {
  id: string;
  userId: string;
  type: 'subscription' | 'course' | 'consultation' | 'plan';
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  dueDate: Timestamp;
  paidAt?: Timestamp;
  paymentMethod?: string;
  transactionId?: string;
  invoice?: {
    number: string;
    url: string;
  };
  relatedItemId?: string; // courseId, planId, etc
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Enhanced Notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'meal' | 'reminder' | 'achievement' | 'general' | 'payment' | 'appointment' | 'message' | 'course';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetUsers: string[];
  isRead: boolean;
  deepLink?: string; // Para navegação específica
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  data?: Record<string, any>; // Dados extras para contexto
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  scheduledFor?: Timestamp;
  readAt?: Timestamp;
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
      isRead: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Student CRUD operations
export const createStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'students'), {
      ...student,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const getStudentByUserId = (userId: string, callback: (student: Student | null) => void) => {
  const q = query(
    collection(db, 'students'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Student));
    callback(students.length > 0 ? students[0] : null);
  });
};

export const updateStudentProfile = async (studentId: string, updates: Partial<Student>) => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

// Workout Session operations
export const createWorkoutSession = async (session: Omit<WorkoutSession, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'workout_sessions'), {
      ...session,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }
};

export const getWorkoutSessionsByUser = (userId: string, callback: (sessions: WorkoutSession[]) => void) => {
  const q = query(
    collection(db, 'workout_sessions'),
    where('userId', '==', userId),
    orderBy('startTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WorkoutSession));
    callback(sessions);
  });
};

export const updateWorkoutSession = async (sessionId: string, updates: Partial<WorkoutSession>) => {
  try {
    await updateDoc(doc(db, 'workout_sessions', sessionId), updates);
  } catch (error) {
    console.error('Error updating workout session:', error);
    throw error;
  }
};

// Meal Log operations
export const createMealLog = async (log: Omit<MealLog, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'meal_logs'), {
      ...log,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating meal log:', error);
    throw error;
  }
};

export const getMealLogsByUser = (userId: string, callback: (logs: MealLog[]) => void) => {
  const q = query(
    collection(db, 'meal_logs'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MealLog));
    callback(logs);
  });
};

// Course operations
export const getCoursesByUser = (userId: string, callback: (courses: Course[]) => void) => {
  const q = query(
    collection(db, 'courses'),
    where('enrolledUsers', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));
    callback(courses);
  });
};

export const getCourseProgress = (userId: string, courseId: string, callback: (progress: CourseProgress | null) => void) => {
  const q = query(
    collection(db, 'course_progress'),
    where('userId', '==', userId),
    where('courseId', '==', courseId)
  );

  return onSnapshot(q, (snapshot) => {
    const progress = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CourseProgress));
    callback(progress.length > 0 ? progress[0] : null);
  });
};

export const updateCourseProgress = async (progressId: string, updates: Partial<CourseProgress>) => {
  try {
    await updateDoc(doc(db, 'course_progress', progressId), {
      ...updates,
      lastAccessed: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

// Appointment operations
export const getAppointmentsByUser = (userId: string, callback: (appointments: Appointment[]) => void) => {
  const q = query(
    collection(db, 'appointments'),
    where('studentId', '==', userId),
    orderBy('scheduledTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Appointment));
    callback(appointments);
  });
};

// Chat operations
export const getChatMessages = (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, 'chat_messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
    callback(messages);
  });
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'chat_messages'), {
      ...message,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    await updateDoc(doc(db, 'chat_messages', messageId), {
      isRead: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Payment operations
export const getPaymentsByUser = (userId: string, callback: (payments: Payment[]) => void) => {
  const q = query(
    collection(db, 'payments'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
    callback(payments);
  });
};

// Medical Exams
export interface MedicalExam {
  id: string;
  userId: string;
  type: string;
  value: string;
  unit: string;
  date: Timestamp;
  fileUrl?: string;
  notes?: string;
  createdAt: Timestamp;
}

export const addMedicalExam = async (exam: Omit<MedicalExam, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'medical_exams'), {
    ...exam,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getMedicalExamsByUser = (userId: string, callback: (exams: MedicalExam[]) => void) => {
  const q = query(
    collection(db, 'medical_exams'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalExam));
    callback(exams);
  });
};

// Progress Photos
export interface ProgressPhoto {
  id: string;
  userId: string;
  url: string;
  label?: string;
  date: Timestamp;
  createdAt: Timestamp;
}

export const addProgressPhoto = async (photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'progress_photos'), {
    ...photo,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getProgressPhotosByUser = (userId: string, callback: (photos: ProgressPhoto[]) => void) => {
  const q = query(
    collection(db, 'progress_photos'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressPhoto));
    callback(photos);
  });
};

// Physical Assessments
export interface PhysicalAssessment {
  id: string;
  userId: string;
  date: Timestamp;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  hip?: number;
  notes?: string;
  createdAt: Timestamp;
}

export const addPhysicalAssessment = async (assessment: Omit<PhysicalAssessment, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'physical_assessments'), {
    ...assessment,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getPhysicalAssessmentsByUser = (userId: string, callback: (assessments: PhysicalAssessment[]) => void) => {
  const q = query(
    collection(db, 'physical_assessments'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhysicalAssessment));
    callback(assessments);
  });
};