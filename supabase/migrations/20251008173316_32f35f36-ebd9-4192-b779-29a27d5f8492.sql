-- ============================================
-- FASE 1, 2 & 4: CORREÇÕES E OTIMIZAÇÕES
-- ============================================

-- 1. Proteger tabela products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own products" ON public.products;
DROP POLICY IF EXISTS "Students can view teacher products" ON public.products;
DROP POLICY IF EXISTS "Teachers can manage own products" ON public.products;

CREATE POLICY "Teachers can view own products"
ON public.products FOR SELECT TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Students can view teacher products"
ON public.products FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.user_id = auth.uid() AND s.teacher_id = products.instructor_id
));

CREATE POLICY "Teachers can manage own products"
ON public.products FOR ALL TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- 2. Corrigir gamification_settings
ALTER TABLE public.gamification_settings 
ALTER COLUMN teacher_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gamification_settings_teacher 
ON public.gamification_settings(teacher_id);

INSERT INTO public.gamification_settings (
  teacher_id, points_workout, points_checkin, points_meal_log,
  points_progress_update, points_goal_achieved, points_assessment,
  points_medical_exam, points_ai_interaction, points_teacher_message,
  level_up_bonus, max_daily_points
) VALUES (NULL, 75, 10, 25, 100, 300, 150, 100, 5, 20, 50, 500)
ON CONFLICT DO NOTHING;

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_students_teacher_user 
ON public.students(teacher_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gamification_activities_user_date 
ON public.gamification_activities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_teacher_time 
ON public.appointments(teacher_id, scheduled_time) 
WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date 
ON public.meal_logs(user_id, date);