-- ============================================================================
-- SECURITY FIXES - Shape Pro Project (Corrected)
-- ============================================================================

-- 1. FIX CRITICAL: Rewards Items Table - Remove conflicting permissive policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view active rewards" ON public.rewards_items;

-- Keep only the secure policies that already exist:
-- "Teachers can manage own rewards" 
-- "Students can view teacher rewards"

-- 2. FIX HIGH: Add SET search_path = public to vulnerable functions
-- ============================================================================

-- Function: get_teacher_name
CREATE OR REPLACE FUNCTION public.get_teacher_name(teacher_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  teacher_name text;
BEGIN
  SELECT COALESCE(p.name, p.email) INTO teacher_name
  FROM profiles p
  WHERE p.id = teacher_id_param;
  
  RETURN COALESCE(teacher_name, 'Professor');
END;
$function$;

-- Function: get_current_plan_week
CREATE OR REPLACE FUNCTION public.get_current_plan_week(plan_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  weeks_passed INTEGER;
  rotation_weeks INTEGER;
  start_date DATE;
BEGIN
  SELECT 
    np.rotation_weeks,
    np.week_start_date
  INTO rotation_weeks, start_date
  FROM nutrition_plans np
  WHERE np.id = plan_id;
  
  IF start_date IS NULL THEN
    RETURN 1;
  END IF;
  
  weeks_passed := FLOOR(EXTRACT(days FROM (CURRENT_DATE - start_date)) / 7);
  RETURN (weeks_passed % rotation_weeks) + 1;
END;
$function$;

-- Function: cleanup_old_chat_messages
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM chat_messages 
  WHERE created_at < (now() - interval '3 months');
  
  RAISE NOTICE 'Cleaned chat messages older than 3 months';
END;
$function$;

-- Function: calculate_user_level
CREATE OR REPLACE FUNCTION public.calculate_user_level(points integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN FLOOR(SQRT(points / 100.0)) + 1;
END;
$function$;

-- Function: sanitize_chat_input
CREATE OR REPLACE FUNCTION public.sanitize_chat_input(input_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF input_text IS NULL OR LENGTH(input_text) > 5000 THEN
    RETURN FALSE;
  END IF;
  
  IF input_text ILIKE '%<script%' OR
     input_text ILIKE '%javascript:%' OR
     input_text ILIKE '%data:text/html%' OR
     input_text ILIKE '%<iframe%' OR
     input_text ILIKE '%<object%' OR
     input_text ILIKE '%<embed%' OR
     input_text ILIKE '%eval(%' OR
     input_text ILIKE '%document.%' OR
     input_text ILIKE '%window.%' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Function: trigger_check_achievements
CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Function: check_and_award_achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  achievement record;
  user_data record;
  should_award boolean;
BEGIN
  SELECT 
    up.total_points,
    up.current_streak,
    up.longest_streak,
    COUNT(CASE WHEN ga.activity_type = 'training_completed' THEN 1 END) as training_count,
    COUNT(CASE WHEN ga.activity_type = 'appointment_attended' THEN 1 END) as appointment_count
  INTO user_data
  FROM user_points up
  LEFT JOIN gamification_activities ga ON ga.user_id = up.user_id
  WHERE up.user_id = p_user_id
  GROUP BY up.user_id, up.total_points, up.current_streak, up.longest_streak;

  IF user_data IS NULL THEN
    INSERT INTO user_points (user_id) VALUES (p_user_id);
    RETURN;
  END IF;

  FOR achievement IN 
    SELECT a.* FROM achievements a
    JOIN students s ON s.teacher_id = a.created_by
    WHERE s.user_id = p_user_id
    AND a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    should_award := false;
    
    CASE achievement.condition_type
      WHEN 'training_count' THEN
        should_award := user_data.training_count >= achievement.condition_value;
      WHEN 'streak_days' THEN
        should_award := user_data.current_streak >= achievement.condition_value;
      WHEN 'appointment_count' THEN
        should_award := user_data.appointment_count >= achievement.condition_value;
      WHEN 'progress_milestone' THEN
        should_award := user_data.total_points >= achievement.condition_value;
    END CASE;
    
    IF should_award THEN
      INSERT INTO user_achievements (user_id, achievement_id, points_earned)
      VALUES (p_user_id, achievement.id, achievement.points_reward);
      
      PERFORM award_points(
        p_user_id,
        achievement.points_reward,
        'achievement_earned',
        'Conquistou: ' || achievement.title,
        jsonb_build_object('achievement_id', achievement.id)
      );
    END IF;
  END LOOP;
END;
$function$;

-- ============================================================================
-- SECURITY ENHANCEMENTS APPLIED
-- ============================================================================
-- ✅ Rewards table: Removed conflicting permissive policy
-- ✅ Database functions: Added SET search_path = public to 7 functions
-- ============================================================================