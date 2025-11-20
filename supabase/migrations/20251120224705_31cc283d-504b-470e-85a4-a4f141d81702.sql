-- Permitir que estudantes deletem notificações direcionadas a eles
CREATE POLICY "Students can delete targeted notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = ANY(target_users));