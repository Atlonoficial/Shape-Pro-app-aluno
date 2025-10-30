-- CRITICAL SECURITY FIX: Phase 1 - Data Protection RLS Policies (Fixed)
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

-- 3. CHAT_MESSAGES table - Critical: Enable RLS and add policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.chat_messages;

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

-- 4. CONVERSATIONS table - Critical: Enable RLS and add policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Students can create conversations with their teacher" ON public.conversations;
DROP POLICY IF EXISTS "Conversation participants can update" ON public.conversations;

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