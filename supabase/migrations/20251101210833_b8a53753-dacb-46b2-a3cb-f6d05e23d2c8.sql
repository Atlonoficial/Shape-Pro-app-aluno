-- Corrigir search_path em funções SQL para prevenir SQL injection
-- Adicionar SET search_path = public em todas as funções SECURITY DEFINER

-- 1. award_points_enhanced_v3
CREATE OR REPLACE FUNCTION public.award_points_enhanced_v3(
  p_user_id uuid, 
  p_activity_type text, 
  p_description text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb, 
  p_custom_points integer DEFAULT NULL::integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
  v_config jsonb;
  v_result jsonb;
  v_new_total_points integer;
  v_old_level integer;
  v_new_level integer;
  v_level_changed boolean := false;
BEGIN
  -- Get points configuration
  SELECT points_config INTO v_config
  FROM gamification_settings
  WHERE id = 1;
  
  IF v_config IS NULL THEN
    v_config := '{
      "daily_login": 10,
      "workout_completed": 50,
      "nutrition_logged": 20,
      "progress_logged": 15,
      "achievement_unlocked": 100,
      "streak_milestone": 75,
      "feedback_completed": 30,
      "periodic_feedback": 50
    }'::jsonb;
  END IF;

  -- Determine points
  IF p_custom_points IS NOT NULL THEN
    v_points := p_custom_points;
  ELSIF p_activity_type = 'periodic_feedback' THEN
    v_points := COALESCE((v_config->>'periodic_feedback')::integer, 50);
  ELSE
    v_points := COALESCE((v_config->>p_activity_type)::integer, 0);
  END IF;

  -- Get current level
  SELECT level INTO v_old_level
  FROM gamification_stats
  WHERE user_id = p_user_id;

  -- Update or insert stats
  INSERT INTO gamification_stats (user_id, points, level)
  VALUES (p_user_id, v_points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = gamification_stats.points + v_points,
    level = CASE 
      WHEN (gamification_stats.points + v_points) >= 10000 THEN 10
      WHEN (gamification_stats.points + v_points) >= 5000 THEN 9
      WHEN (gamification_stats.points + v_points) >= 2500 THEN 8
      WHEN (gamification_stats.points + v_points) >= 1500 THEN 7
      WHEN (gamification_stats.points + v_points) >= 1000 THEN 6
      WHEN (gamification_stats.points + v_points) >= 750 THEN 5
      WHEN (gamification_stats.points + v_points) >= 500 THEN 4
      WHEN (gamification_stats.points + v_points) >= 250 THEN 3
      WHEN (gamification_stats.points + v_points) >= 100 THEN 2
      ELSE 1
    END,
    updated_at = now()
  RETURNING points, level INTO v_new_total_points, v_new_level;

  -- Check if level changed
  IF v_new_level > v_old_level THEN
    v_level_changed := true;
  END IF;

  -- Insert activity record
  INSERT INTO gamification_activities (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    v_points,
    COALESCE(p_description, p_activity_type),
    p_metadata
  );

  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'new_total_points', v_new_total_points,
    'new_level', v_new_level,
    'level_changed', v_level_changed
  );

  RETURN v_result;
END;
$$;

-- 2. create_or_update_feedback
CREATE OR REPLACE FUNCTION public.create_or_update_feedback(
  p_user_id uuid, 
  p_student_id uuid, 
  p_workout_session_id uuid DEFAULT NULL::uuid, 
  p_nutrition_log_id uuid DEFAULT NULL::uuid, 
  p_feedback_type text DEFAULT NULL::text, 
  p_feedback_text text DEFAULT NULL::text, 
  p_rating integer DEFAULT NULL::integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback_id uuid;
  v_result jsonb;
BEGIN
  -- Insert or update feedback
  INSERT INTO teacher_feedback (
    teacher_id,
    student_id,
    workout_session_id,
    nutrition_log_id,
    feedback_type,
    feedback_text,
    rating
  ) VALUES (
    p_user_id,
    p_student_id,
    p_workout_session_id,
    p_nutrition_log_id,
    p_feedback_type,
    p_feedback_text,
    p_rating
  )
  ON CONFLICT (id) DO UPDATE SET
    feedback_text = COALESCE(EXCLUDED.feedback_text, teacher_feedback.feedback_text),
    rating = COALESCE(EXCLUDED.rating, teacher_feedback.rating),
    updated_at = now()
  RETURNING id INTO v_feedback_id;

  v_result := jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id
  );

  RETURN v_result;
END;
$$;

-- 3. update_student_stats
CREATE OR REPLACE FUNCTION public.update_student_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last activity timestamp
  UPDATE students
  SET last_activity_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- 4. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  );

  -- Initialize gamification stats
  INSERT INTO public.gamification_stats (user_id, points, level)
  VALUES (NEW.id, 0, 1);

  RETURN NEW;
END;
$$;

-- 5. update_workout_progress
CREATE OR REPLACE FUNCTION public.update_workout_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update workout stats when session is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE students
    SET 
      total_workouts = COALESCE(total_workouts, 0) + 1,
      last_workout_at = NEW.completed_at
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. calculate_streak
CREATE OR REPLACE FUNCTION public.calculate_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer := 0;
  v_current_date date := CURRENT_DATE;
  v_last_activity date;
BEGIN
  -- Get last activity date
  SELECT MAX(DATE(created_at)) INTO v_last_activity
  FROM gamification_activities
  WHERE user_id = p_user_id;

  -- If no activity, return 0
  IF v_last_activity IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate streak
  WHILE v_last_activity = v_current_date LOOP
    v_streak := v_streak + 1;
    v_current_date := v_current_date - 1;
    
    SELECT MAX(DATE(created_at)) INTO v_last_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND DATE(created_at) = v_current_date;
      
    IF v_last_activity IS NULL THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$;