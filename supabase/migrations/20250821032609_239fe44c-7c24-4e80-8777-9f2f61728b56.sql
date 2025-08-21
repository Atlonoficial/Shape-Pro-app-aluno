-- ============================================================================
-- PHASE 1: UPDATE REWARDS SYSTEM TO CONNECT WITH TEACHERS
-- ============================================================================

-- Update RLS policy for rewards_items to show only teacher's rewards to students
DROP POLICY IF EXISTS "Students can view teacher rewards" ON public.rewards_items;
CREATE POLICY "Students can view teacher rewards" 
ON public.rewards_items 
FOR SELECT 
USING (
  is_active = true AND (
    -- Teacher can see own rewards
    auth.uid() = created_by OR
    -- Students can see their teacher's rewards
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.user_id = auth.uid() 
      AND s.teacher_id = rewards_items.created_by
    )
  )
);

-- ============================================================================
-- PHASE 2: CREATE AUTOMATIC GAMIFICATION TRIGGERS
-- ============================================================================

-- Trigger for workout completion
CREATE OR REPLACE FUNCTION auto_award_workout_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM public.award_points_enhanced(
      NEW.user_id,
      'training_completed',
      'Treino completado: ' || COALESCE(NEW.name, 'Treino'),
      jsonb_build_object('workout_id', NEW.id, 'duration', NEW.duration)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for meal logging
CREATE OR REPLACE FUNCTION auto_award_meal_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consumed = true AND (OLD IS NULL OR OLD.consumed = false) THEN
    PERFORM public.award_points_enhanced(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for progress updates
CREATE OR REPLACE FUNCTION auto_award_progress_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.award_points_enhanced(
    NEW.user_id,
    'progress_updated',
    'Progresso atualizado',
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables (will create if tables exist)
DO $$ 
BEGIN
  -- Workout sessions trigger
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_sessions') THEN
    DROP TRIGGER IF EXISTS trigger_award_workout_points ON workout_sessions;
    CREATE TRIGGER trigger_award_workout_points
      AFTER UPDATE ON workout_sessions
      FOR EACH ROW
      EXECUTE FUNCTION auto_award_workout_points();
  END IF;

  -- Meal logs trigger  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meal_logs') THEN
    DROP TRIGGER IF EXISTS trigger_award_meal_points ON meal_logs;
    CREATE TRIGGER trigger_award_meal_points
      AFTER INSERT OR UPDATE ON meal_logs
      FOR EACH ROW
      EXECUTE FUNCTION auto_award_meal_points();
  END IF;

  -- Progress tracking trigger (assuming there's a progress table)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'progress_records') THEN
    DROP TRIGGER IF EXISTS trigger_award_progress_points ON progress_records;
    CREATE TRIGGER trigger_award_progress_points
      AFTER INSERT ON progress_records
      FOR EACH ROW
      EXECUTE FUNCTION auto_award_progress_points();
  END IF;
END $$;

-- ============================================================================
-- PHASE 3: ENABLE REAL-TIME UPDATES
-- ============================================================================

-- Enable realtime for gamification tables
ALTER TABLE public.user_points REPLICA IDENTITY FULL;
ALTER TABLE public.gamification_activities REPLICA IDENTITY FULL;
ALTER TABLE public.user_achievements REPLICA IDENTITY FULL;
ALTER TABLE public.rewards_items REPLICA IDENTITY FULL;
ALTER TABLE public.reward_redemptions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gamification_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_redemptions;

-- ============================================================================
-- PHASE 4: OPTIMIZE PERFORMANCE WITH INDEXES
-- ============================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_activities_user_id ON public.gamification_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_items_created_by ON public.rewards_items(created_by, is_active);
CREATE INDEX IF NOT EXISTS idx_students_teacher_user ON public.students(teacher_id, user_id);

-- ============================================================================
-- PHASE 5: CREATE STREAK MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to update streaks automatically
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_activity_date date;
  current_streak integer := 0;
  longest_streak integer := 0;
  today date := CURRENT_DATE;
BEGIN
  -- Get current streak data
  SELECT 
    COALESCE(last_activity_date, today - interval '2 days')::date,
    COALESCE(current_streak, 0),
    COALESCE(longest_streak, 0)
  INTO last_activity_date, current_streak, longest_streak
  FROM user_points 
  WHERE user_id = p_user_id;
  
  -- If no user_points record, create one
  IF NOT FOUND THEN
    INSERT INTO user_points (user_id, total_points, level, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 0, 1, 1, 1, today);
    RETURN;
  END IF;
  
  -- Calculate new streak
  IF last_activity_date = today THEN
    -- Already updated today, do nothing
    RETURN;
  ELSIF last_activity_date = today - interval '1 day' THEN
    -- Consecutive day, increment streak
    current_streak := current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    current_streak := 1;
  END IF;
  
  -- Update longest streak if necessary
  IF current_streak > longest_streak THEN
    longest_streak := current_streak;
  END IF;
  
  -- Update the record
  UPDATE user_points 
  SET 
    current_streak = current_streak,
    longest_streak = longest_streak,
    last_activity_date = today
  WHERE user_id = p_user_id;
END;
$$;