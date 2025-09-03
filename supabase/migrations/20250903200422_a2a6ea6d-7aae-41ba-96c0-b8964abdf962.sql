-- Fix RLS policies for course_modules to show ALL published modules
-- First drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can view all published modules from teacher" ON public.course_modules;
DROP POLICY IF EXISTS "Teachers can manage own course modules" ON public.course_modules;
DROP POLICY IF EXISTS "Students can view accessible lessons" ON public.course_modules;
DROP POLICY IF EXISTS "Teachers can manage own course lessons" ON public.course_modules;

-- Create new policy: Students can view ALL published modules from their teacher's courses
CREATE POLICY "Students can view all published modules from teacher" 
ON public.course_modules 
FOR SELECT 
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.students s ON s.teacher_id = c.instructor
    WHERE c.id = course_modules.course_id 
      AND s.user_id = auth.uid()
  )
);

-- Create teacher management policy
CREATE POLICY "Teachers can manage own course modules" 
ON public.course_modules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_modules.course_id 
      AND c.instructor = auth.uid()
  )
);