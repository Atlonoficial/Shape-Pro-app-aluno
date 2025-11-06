-- Tabela para controle manual de acesso a aulas pelos professores
CREATE TABLE IF NOT EXISTS public.lesson_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(lesson_id, student_id)
);

-- RLS Policies
ALTER TABLE public.lesson_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson access"
  ON public.lesson_access FOR SELECT
  USING (
    student_id = auth.uid() OR 
    granted_by = auth.uid()
  );

CREATE POLICY "Teachers can grant lesson access"
  ON public.lesson_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'teacher'
    )
  );

CREATE POLICY "Teachers can revoke lesson access"
  ON public.lesson_access FOR DELETE
  USING (granted_by = auth.uid());

-- Index para performance
CREATE INDEX idx_lesson_access_student ON lesson_access(student_id);
CREATE INDEX idx_lesson_access_lesson ON lesson_access(lesson_id);