import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

// Interfaces for Supabase
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  user_type: 'student' | 'teacher';
  profile_complete: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  user_id: string;
  teacher_id?: string;
  active_plan?: string;
  goals: string[];
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  measurements_updated_at?: string;
  notifications: boolean;
  language: string;
  timezone: string;
  membership_status: 'active' | 'suspended' | 'expired';
  membership_expiry?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: any[];
  estimated_duration?: number;
  estimated_calories?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups?: string[];
  tags?: string[];
  assigned_to: string[];
  created_by?: string;
  is_template: boolean;
  template_category?: string;
  sessions: number;
  last_completed?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionPlan {
  id: string;
  name: string;
  description?: string;
  meals: any[];
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  daily_fiber?: number;
  daily_water?: number;
  weekly_schedule?: any;
  assigned_to: string[];
  created_by?: string;
  is_template: boolean;
  tags?: string[];
  duration?: number;
  start_date?: string;
  end_date?: string;
  adherence_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'meal' | 'reminder' | 'achievement' | 'general' | 'payment' | 'appointment' | 'message' | 'course';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_users: string[];
  is_read: boolean;
  deep_link?: string;
  action_required?: boolean;
  action_url?: string;
  action_text?: string;
  image_url?: string;
  data?: any;
  expires_at?: string;
  scheduled_for?: string;
  read_at?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'student' | 'teacher';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'audio';
  attachments?: any[];
  reply_to?: string;
  is_read: boolean;
  read_at?: string;
  edited_at?: string;
  deleted_at?: string;
  created_at?: string;
}

// Auth functions
export const signUpUser = async (email: string, password: string, name: string, userType: 'student' | 'teacher' = 'student') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
      data: {
        name,
        user_type: userType
      }
    }
  });

  if (error) throw error;
  return data; // contains { user, session }
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data.user;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPasswordForEmail = async (email: string) => {
  console.log(`[resetPasswordForEmail] Iniciando reset para: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/recovery`,
    });
    
    if (error) {
      console.error('[resetPasswordForEmail] Erro do Supabase:', error);
      throw error;
    }
    
    console.log('[resetPasswordForEmail] Reset iniciado com sucesso:', data);
    return data;
  } catch (error: any) {
    console.error('[resetPasswordForEmail] Erro capturado:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    // Melhorar mensagens de erro específicas
    if (error.message?.includes('rate')) {
      throw new Error('Muitas tentativas de reset. Aguarde alguns minutos antes de tentar novamente.');
    }
    
    if (error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error('Email não encontrado no sistema.');
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
    
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  return data as UserProfile;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', uid);

  if (error) throw error;
};

export const onAuthStateChange = (callback: (user: User | null, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, session);
  });
};

// Student functions
export const getStudentsByTeacher = (teacherId: string, callback: (students: any[]) => void) => {
  const channel = supabase
    .channel('teacher-students-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'students',
        filter: `teacher_id=eq.${teacherId}`
      },
      () => {
        fetchStudents();
      }
    )
    .subscribe();

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles!students_user_id_fkey(name, email, avatar_url)
      `)
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('Error fetching students:', error);
      callback([]);
      return;
    }
    callback(data || []);
  };

  fetchStudents();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getStudentAssessments = async (userId: string) => {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'physical_assessment')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getStudentByUserId = (userId: string, callback: (student: Student | null) => void) => {
  const channel = supabase
    .channel('student-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'students',
        filter: `user_id=eq.${userId}`
      },
      () => {
        fetchStudent();
      }
    )
    .subscribe();

  const fetchStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching student:', error);
      callback(null);
      return;
    }
    callback(data as Student);
  };

  fetchStudent();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const createStudent = async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateStudentProfile = async (studentId: string, updates: Partial<Student>) => {
  const { error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', studentId);

  if (error) throw error;
};

// Workout functions
export const getWorkoutsByUser = (userId: string, callback: (workouts: Workout[]) => void) => {
  const channel = supabase
    .channel('workout-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workouts'
      },
      () => {
        fetchWorkouts();
      }
    )
    .subscribe();

  const fetchWorkouts = async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .contains('assigned_to', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      callback([]);
      return;
    }
    callback((data || []) as Workout[]);
  };

  fetchWorkouts();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Nutrition functions
export const getNutritionPlansByUser = (userId: string, callback: (plans: NutritionPlan[]) => void) => {
  const channel = supabase
    .channel('nutrition-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'nutrition_plans'
      },
      () => {
        fetchPlans();
      }
    )
    .subscribe();

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .contains('assigned_to', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nutrition plans:', error);
      callback([]);
      return;
    }
    callback((data || []) as NutritionPlan[]);
  };

  fetchPlans();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Notifications functions
export const getNotificationsByUser = (userId: string, callback: (notifications: Notification[]) => void) => {
  const channel = supabase
    .channel('notification-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications'
      },
      () => {
        fetchNotifications();
      }
    )
    .subscribe();

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .contains('target_users', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      callback([]);
      return;
    }
    callback((data || []) as Notification[]);
  };

  fetchNotifications();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .contains('target_users', [userId])
    .eq('is_read', false);

  if (error) throw error;
};

export const clearAllNotifications = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .contains('target_users', [userId]);

  if (error) throw error;
};

// Chat functions
export const getChatMessages = (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
  const channel = supabase
    .channel('chat-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      () => {
        fetchMessages();
      }
    )
    .subscribe();

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      callback([]);
      return;
    }
    callback((data || []) as ChatMessage[]);
  };

  fetchMessages();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Meal logs functions
export const getMealLogsByUserAndDate = (userId: string, date: string, callback: (logs: any[]) => void) => {
  const channel = supabase
    .channel('meal-logs-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_logs',
        filter: `user_id=eq.${userId}`
      },
      () => {
        fetchMealLogs();
      }
    )
    .subscribe();

  const fetchMealLogs = async () => {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${date}T00:00:00`)
      .lt('date', `${date}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meal logs:', error);
      callback([]);
      return;
    }
    callback(data || []);
  };

  fetchMealLogs();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const createMealLog = async (mealLog: {
  user_id: string;
  nutrition_plan_id: string;
  meal_id: string;
  date: string;
  consumed: boolean;
  actual_time?: string;
  notes?: string;
  photo_url?: string;
  rating?: number;
  custom_portion_amount?: number;
  custom_portion_unit?: string;
}) => {
  const { data, error } = await supabase
    .from('meal_logs')
    .insert(mealLog)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMealLog = async (logId: string, updates: any) => {
  const { data, error } = await supabase
    .from('meal_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Anamnese functions for teachers
export const getStudentAnamnese = async (studentUserId: string) => {
  const { data, error } = await supabase
    .from('anamneses')
    .select('*')
    .eq('user_id', studentUserId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};