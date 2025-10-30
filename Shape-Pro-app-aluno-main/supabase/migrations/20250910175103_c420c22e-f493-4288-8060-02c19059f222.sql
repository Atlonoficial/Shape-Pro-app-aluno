-- CRITICAL SECURITY FIX: Phase 5 - Continue Fixing Remaining Functions
-- Fix more functions with search_path issues

-- Fix update_monthly_rankings function
CREATE OR REPLACE FUNCTION public.update_monthly_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  student_record RECORD;
  position_counter INTEGER;
BEGIN
  FOR student_record IN
    SELECT DISTINCT s.teacher_id
    FROM students s
    WHERE s.teacher_id IS NOT NULL
  LOOP
    DELETE FROM monthly_rankings 
    WHERE teacher_id = student_record.teacher_id 
    AND month = current_month;
    
    position_counter := 1;
    
    INSERT INTO monthly_rankings (user_id, teacher_id, month, position, total_points)
    SELECT 
      up.user_id,
      student_record.teacher_id,
      current_month,
      ROW_NUMBER() OVER (ORDER BY up.total_points DESC),
      up.total_points
    FROM user_points up
    JOIN students s ON s.user_id = up.user_id
    WHERE s.teacher_id = student_record.teacher_id
    ORDER BY up.total_points DESC;
  END LOOP;
END;
$$;

-- Fix get_meals_for_today function
CREATE OR REPLACE FUNCTION public.get_meals_for_today(p_user_id uuid)
RETURNS TABLE(meal_id uuid, meal_name text, meal_time time without time zone, meal_type text, calories integer, protein numeric, carbs numeric, fat numeric, foods jsonb, is_logged boolean, log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_id UUID;
  current_week INTEGER;
  today_dow INTEGER;
BEGIN
  SELECT np.id INTO plan_id
  FROM nutrition_plans np
  WHERE (np.assigned_to IS NULL OR p_user_id = ANY(np.assigned_to) OR np.created_by = p_user_id)
    AND (np.start_date IS NULL OR np.start_date <= CURRENT_DATE)
    AND (np.end_date IS NULL OR np.end_date >= CURRENT_DATE)
  ORDER BY np.created_at DESC
  LIMIT 1;
  
  IF plan_id IS NULL THEN
    RETURN;
  END IF;
  
  current_week := get_current_plan_week(plan_id);
  today_dow := EXTRACT(dow FROM CURRENT_DATE);
  
  RETURN QUERY
  SELECT 
    m.id as meal_id,
    m.name as meal_name,
    m.time as meal_time,
    m.meal_type,
    m.calories,
    m.protein,
    m.carbs,
    m.fat,
    m.foods,
    (ml.consumed IS NOT NULL AND ml.consumed = true) as is_logged,
    ml.id as log_id
  FROM (
    SELECT mr.meal_id
    FROM meal_rotations mr
    WHERE mr.nutrition_plan_id = plan_id
      AND mr.week_number = current_week
      AND mr.day_of_week = today_dow
    
    UNION ALL
    
    SELECT (meal_id_json.value#>>'{}')::UUID as meal_id
    FROM nutrition_plans np,
         jsonb_array_elements(np.meal_ids) meal_id_json
    WHERE np.id = plan_id
      AND NOT EXISTS (
        SELECT 1 FROM meal_rotations mr2 
        WHERE mr2.nutrition_plan_id = plan_id 
          AND mr2.week_number = current_week 
          AND mr2.day_of_week = today_dow
      )
  ) plan_meals
  JOIN meals m ON m.id = plan_meals.meal_id
  LEFT JOIN meal_logs ml ON ml.meal_id = m.id 
    AND ml.user_id = p_user_id 
    AND DATE(ml.date) = CURRENT_DATE
  ORDER BY m.time;
END;
$$;

-- Fix check_and_award_achievements function
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;