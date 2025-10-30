-- Criar política RLS para permitir que estudantes vejam a disponibilidade do seu professor
CREATE POLICY "Students can view teacher availability" 
ON public.teacher_availability 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid() 
    AND s.teacher_id = teacher_availability.teacher_id
  )
);