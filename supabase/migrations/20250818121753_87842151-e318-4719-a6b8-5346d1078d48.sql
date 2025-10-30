-- Allow students to update (cancel) their own appointments
CREATE POLICY "Students can cancel own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);