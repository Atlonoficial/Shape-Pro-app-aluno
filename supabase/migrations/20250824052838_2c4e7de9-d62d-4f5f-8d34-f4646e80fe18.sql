-- Create table for course unlock requests to notify teachers
CREATE TABLE public.course_unlock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.course_unlock_requests ENABLE ROW LEVEL SECURITY;

-- Students can create requests for courses
CREATE POLICY "Students can create unlock requests" 
ON public.course_unlock_requests 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can view their own requests
CREATE POLICY "Students can view own requests" 
ON public.course_unlock_requests 
FOR SELECT 
USING (auth.uid() = student_id);

-- Teachers can view requests for their courses
CREATE POLICY "Teachers can view student requests" 
ON public.course_unlock_requests 
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Teachers can update request status
CREATE POLICY "Teachers can update requests" 
ON public.course_unlock_requests 
FOR UPDATE 
USING (auth.uid() = teacher_id);