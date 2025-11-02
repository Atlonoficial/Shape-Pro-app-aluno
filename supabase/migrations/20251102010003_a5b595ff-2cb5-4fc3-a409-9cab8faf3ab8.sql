-- Fix award_points_enhanced_v3 to use individual point columns instead of points_config
DROP FUNCTION IF EXISTS public.award_points_enhanced_v3(uuid, text, text, jsonb, integer);

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
  v_settings record;
  v_result jsonb;
  v_new_total_points integer;
  v_old_level integer;
  v_new_level integer;
  v_level_changed boolean := false;
BEGIN
  -- Get points configuration from individual columns (not points_config which doesn't exist)
  SELECT 
    points_workout,
    points_checkin,
    points_meal_log,
    points_progress_update,
    points_goal_achieved,
    points_assessment,
    points_medical_exam,
    points_ai_interaction,
    points_teacher_message
  INTO v_settings
  FROM gamification_settings
  WHERE id = 1;
  
  -- Determine points based on activity type
  IF p_custom_points IS NOT NULL THEN
    v_points := p_custom_points;
  ELSE
    v_points := CASE p_activity_type
      WHEN 'workout_completed' THEN COALESCE(v_settings.points_workout, 50)
      WHEN 'nutrition_logged' THEN COALESCE(v_settings.points_meal_log, 20)
      WHEN 'daily_login' THEN COALESCE(v_settings.points_checkin, 10)
      WHEN 'progress_logged' THEN COALESCE(v_settings.points_progress_update, 15)
      WHEN 'achievement_unlocked' THEN COALESCE(v_settings.points_goal_achieved, 100)
      WHEN 'periodic_feedback' THEN 50
      WHEN 'streak_milestone' THEN 75
      WHEN 'feedback_completed' THEN 30
      WHEN 'assessment_completed' THEN COALESCE(v_settings.points_assessment, 25)
      WHEN 'medical_exam_logged' THEN COALESCE(v_settings.points_medical_exam, 15)
      WHEN 'ai_interaction' THEN COALESCE(v_settings.points_ai_interaction, 5)
      WHEN 'teacher_message' THEN COALESCE(v_settings.points_teacher_message, 10)
      WHEN 'training_completed' THEN COALESCE(v_settings.points_workout, 50)
      ELSE 10
    END;
  END IF;

  -- Get current level
  SELECT COALESCE(level, 1) INTO v_old_level
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
  IF v_new_level > COALESCE(v_old_level, 1) THEN
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_points_enhanced_v3: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;