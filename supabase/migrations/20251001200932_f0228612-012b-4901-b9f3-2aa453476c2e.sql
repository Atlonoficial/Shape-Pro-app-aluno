-- Fix RLS policy for gamification_settings to allow default settings creation
DROP POLICY IF EXISTS "Teachers can manage own settings" ON gamification_settings;

-- Create comprehensive policies for gamification_settings
CREATE POLICY "Teachers can view own settings"
ON gamification_settings FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own settings"
ON gamification_settings FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own settings"
ON gamification_settings FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Allow system to create default settings for teachers
CREATE POLICY "System can create default settings"
ON gamification_settings FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'teacher')
);