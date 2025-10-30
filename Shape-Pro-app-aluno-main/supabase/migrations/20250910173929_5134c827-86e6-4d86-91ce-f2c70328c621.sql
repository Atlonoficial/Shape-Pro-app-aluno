-- CRITICAL SECURITY FIX: Phase 1 - Data Protection RLS Policies
-- This fixes the major security vulnerabilities identified in the security scan

-- 1. PROFILES table - Restrict access to own profile + teacher/student relationships
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can view student profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != id AND 
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id = profiles.id 
    AND s.teacher_id = auth.uid()
  )
);

-- 2. ANAMNESES table - Already has some policies but let's strengthen them
-- Keep existing policies, they look secure

-- 3. CHAT_MESSAGES table - Critical: Missing RLS policies entirely!
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = chat_messages.conversation_id 
    AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages to their conversations" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = chat_messages.conversation_id 
    AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
  )
);

-- 4. CONVERSATIONS table - Critical: Missing RLS policies entirely!
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = teacher_id OR auth.uid() = student_id);

CREATE POLICY "Students can create conversations with their teacher" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = student_id AND
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id = auth.uid() 
    AND s.teacher_id = conversations.teacher_id
  )
);

CREATE POLICY "Conversation participants can update" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = teacher_id OR auth.uid() = student_id)
WITH CHECK (auth.uid() = teacher_id OR auth.uid() = student_id);

-- 5. PAYMENT_TRANSACTIONS table - Already has some policies, let's add missing ones
CREATE POLICY "System can create payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (
  -- Allow system/service role to create transactions
  auth.role() = 'service_role' OR
  -- Or allow if user is creating their own transaction
  auth.uid() = student_id
);

-- 6. MEDICAL_EXAMS table - Critical: No RLS policies!
ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medical exams" 
ON public.medical_exams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical exams" 
ON public.medical_exams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical exams" 
ON public.medical_exams 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can view student medical exams" 
ON public.medical_exams 
FOR SELECT 
USING (is_teacher_of(auth.uid(), user_id));

-- 7. MEAL_LOGS table - Critical: No RLS policies!
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal logs" 
ON public.meal_logs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can view student meal logs" 
ON public.meal_logs 
FOR SELECT 
USING (is_teacher_of(auth.uid(), user_id));

-- 8. MEAL_ROTATIONS table - Missing RLS!
ALTER TABLE public.meal_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal rotations from assigned nutrition plans" 
ON public.meal_rotations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_plans np 
    WHERE np.id = meal_rotations.nutrition_plan_id 
    AND (auth.uid() = ANY(np.assigned_to) OR auth.uid() = np.created_by)
  )
);

CREATE POLICY "Teachers can manage meal rotations" 
ON public.meal_rotations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_plans np 
    WHERE np.id = meal_rotations.nutrition_plan_id 
    AND auth.uid() = np.created_by
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nutrition_plans np 
    WHERE np.id = meal_rotations.nutrition_plan_id 
    AND auth.uid() = np.created_by
  )
);