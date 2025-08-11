-- Criar as tabelas principais do Shape Pro

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de profiles (substitui users do Firebase)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  user_type text CHECK (user_type IN ('student', 'teacher')) DEFAULT 'student',
  profile_complete boolean DEFAULT false,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabela de estudantes
CREATE TABLE public.students (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  teacher_id uuid REFERENCES auth.users,
  active_plan text,
  goals text[] DEFAULT '{}',
  weight numeric,
  height numeric,
  body_fat numeric,
  muscle_mass numeric,
  measurements_updated_at timestamp with time zone,
  notifications boolean DEFAULT true,
  language text DEFAULT 'pt-BR',
  timezone text DEFAULT 'America/Sao_Paulo',
  membership_status text CHECK (membership_status IN ('active', 'suspended', 'expired')) DEFAULT 'active',
  membership_expiry timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Tabela de exercícios
CREATE TABLE public.exercises (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  sets integer NOT NULL,
  reps integer NOT NULL,
  weight numeric,
  duration integer,
  rest_time integer NOT NULL,
  instructions text,
  video_url text,
  muscle_group text NOT NULL,
  equipment text[],
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Tabela de treinos
CREATE TABLE public.workouts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  exercises jsonb NOT NULL DEFAULT '[]',
  estimated_duration integer,
  estimated_calories integer,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  muscle_groups text[],
  tags text[],
  assigned_to uuid[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users,
  is_template boolean DEFAULT false,
  template_category text,
  sessions integer DEFAULT 0,
  last_completed timestamp with time zone,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Tabela de sessões de treino
CREATE TABLE public.workout_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id uuid REFERENCES public.workouts ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  exercises jsonb DEFAULT '[]',
  total_duration integer,
  calories_burned integer,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Tabela de refeições
CREATE TABLE public.meals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  calories integer NOT NULL,
  protein numeric NOT NULL,
  carbs numeric NOT NULL,
  fat numeric NOT NULL,
  fiber numeric,
  sugar numeric,
  sodium numeric,
  time text,
  category text CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  ingredients text[],
  instructions text,
  image_url text,
  portion_amount numeric,
  portion_unit text,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Tabela de planos nutricionais
CREATE TABLE public.nutrition_plans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  meals jsonb DEFAULT '[]',
  daily_calories integer,
  daily_protein numeric,
  daily_carbs numeric,
  daily_fat numeric,
  daily_fiber numeric,
  daily_water integer,
  weekly_schedule jsonb DEFAULT '{}',
  assigned_to uuid[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users,
  is_template boolean DEFAULT false,
  tags text[],
  duration integer,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  adherence_rate numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 8. Tabela de logs de refeições
CREATE TABLE public.meal_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  meal_id uuid REFERENCES public.meals,
  nutrition_plan_id uuid REFERENCES public.nutrition_plans,
  date timestamp with time zone NOT NULL,
  consumed boolean DEFAULT false,
  actual_time text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  photo_url text,
  custom_portion_amount numeric,
  custom_portion_unit text,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. Tabela de progresso
CREATE TABLE public.progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  workout_id uuid REFERENCES public.workouts,
  meal_id uuid REFERENCES public.meals,
  type text CHECK (type IN ('workout', 'weight', 'meal', 'measurement')) NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  notes text,
  date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 10. Tabela de cursos
CREATE TABLE public.courses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  thumbnail text,
  category text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration integer,
  price numeric,
  modules jsonb DEFAULT '[]',
  instructor uuid REFERENCES auth.users,
  tags text[],
  published_at timestamp with time zone,
  is_published boolean DEFAULT false,
  enrolled_users uuid[] DEFAULT '{}',
  rating numeric,
  reviews integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. Tabela de progresso de cursos
CREATE TABLE public.course_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses ON DELETE CASCADE,
  module_progress jsonb DEFAULT '[]',
  overall_progress numeric DEFAULT 0,
  enrolled_at timestamp with time zone DEFAULT now(),
  last_accessed timestamp with time zone DEFAULT now(),
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  UNIQUE(user_id, course_id)
);

-- 12. Tabela de agendamentos
CREATE TABLE public.appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid REFERENCES auth.users ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('consultation', 'assessment', 'follow-up', 'nutrition', 'training')),
  scheduled_time timestamp with time zone NOT NULL,
  duration integer,
  status text CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  location text,
  meeting_link text,
  notes text,
  attachments text[],
  price numeric,
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 13. Tabela de conversas
CREATE TABLE public.conversations (
  id text PRIMARY KEY, -- studentId-teacherId
  student_id uuid REFERENCES auth.users ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  last_message text,
  last_message_at timestamp with time zone DEFAULT now(),
  unread_count_student integer DEFAULT 0,
  unread_count_teacher integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 14. Tabela de mensagens do chat
CREATE TABLE public.chat_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id text REFERENCES public.conversations ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users ON DELETE CASCADE,
  sender_type text CHECK (sender_type IN ('student', 'teacher')),
  message text NOT NULL,
  message_type text CHECK (message_type IN ('text', 'image', 'file', 'audio')) DEFAULT 'text',
  attachments jsonb DEFAULT '[]',
  reply_to uuid REFERENCES public.chat_messages,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 15. Tabela de pagamentos
CREATE TABLE public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  type text CHECK (type IN ('subscription', 'course', 'consultation', 'plan')),
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  due_date timestamp with time zone,
  paid_at timestamp with time zone,
  payment_method text,
  transaction_id text,
  invoice_number text,
  invoice_url text,
  related_item_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 16. Tabela de notificações
CREATE TABLE public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('workout', 'meal', 'reminder', 'achievement', 'general', 'payment', 'appointment', 'message', 'course')),
  priority text CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  target_users uuid[] DEFAULT '{}',
  is_read boolean DEFAULT false,
  deep_link text,
  action_required boolean DEFAULT false,
  action_url text,
  action_text text,
  image_url text,
  data jsonb DEFAULT '{}',
  expires_at timestamp with time zone,
  scheduled_for timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 17. Tabela de banners
CREATE TABLE public.banners (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  message text,
  type text CHECK (type IN ('info', 'warning', 'success', 'error', 'promotion')),
  priority integer DEFAULT 0,
  target_users uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  deep_link text,
  action_text text,
  action_url text,
  image_url text,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can insert profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para students
CREATE POLICY "Students can view own data" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view their students" ON public.students FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Students can update own data" ON public.students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert student data" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para workouts
CREATE POLICY "Users can view assigned workouts" ON public.workouts FOR SELECT USING (auth.uid() = ANY(assigned_to) OR auth.uid() = created_by);
CREATE POLICY "Teachers can create workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Teachers can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = created_by);

-- Políticas RLS para workout_sessions
CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para nutrition_plans
CREATE POLICY "Users can view assigned nutrition plans" ON public.nutrition_plans FOR SELECT USING (auth.uid() = ANY(assigned_to) OR auth.uid() = created_by);
CREATE POLICY "Teachers can create nutrition plans" ON public.nutrition_plans FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Teachers can update own nutrition plans" ON public.nutrition_plans FOR UPDATE USING (auth.uid() = created_by);

-- Políticas RLS para meal_logs
CREATE POLICY "Users can view own meal logs" ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own meal logs" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal logs" ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para progress
CREATE POLICY "Users can view own progress" ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own progress" ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para courses
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Teachers can view own courses" ON public.courses FOR SELECT USING (auth.uid() = instructor);
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = instructor);
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = instructor);

-- Políticas RLS para course_progress
CREATE POLICY "Users can view own course progress" ON public.course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own course progress" ON public.course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course progress" ON public.course_progress FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para appointments
CREATE POLICY "Students can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update appointments" ON public.appointments FOR UPDATE USING (auth.uid() = teacher_id);

-- Políticas RLS para conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = teacher_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (student_id = auth.uid() OR teacher_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = sender_id);

-- Políticas RLS para payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para notifications
CREATE POLICY "Users can view targeted notifications" ON public.notifications FOR SELECT USING (auth.uid() = ANY(target_users));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = ANY(target_users));

-- Políticas RLS para banners
CREATE POLICY "Users can view targeted banners" ON public.banners FOR SELECT USING (
  is_active = true AND 
  (target_users = '{}' OR auth.uid() = ANY(target_users)) AND
  (start_date IS NULL OR start_date <= now()) AND
  (end_date IS NULL OR end_date >= now())
);

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nutrition_plans_updated_at BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();