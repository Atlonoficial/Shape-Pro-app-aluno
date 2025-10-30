-- Allow students to view their teacher's payment settings
CREATE POLICY "Students can view teacher payment settings" 
ON public.teacher_payment_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id = auth.uid() 
      AND s.teacher_id = teacher_payment_settings.teacher_id
  )
);