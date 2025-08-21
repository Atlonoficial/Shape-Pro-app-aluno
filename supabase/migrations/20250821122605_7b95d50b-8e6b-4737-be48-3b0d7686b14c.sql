-- Create policy to allow students to view their teacher's profile
CREATE POLICY "Students can view their teacher profile" 
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.teacher_id = profiles.id 
      AND s.user_id = auth.uid()
      AND profiles.user_type = 'teacher'
    )
  );