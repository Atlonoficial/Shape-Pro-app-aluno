-- SECURITY FIX: Fix the last remaining function search_path issues
-- Find and update any remaining functions without proper search_path

CREATE OR REPLACE FUNCTION public.aggregate_daily_banner_metrics(target_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  processed_records int := 0;
  result json;
BEGIN
  -- Limpar dados existentes para o dia específico
  DELETE FROM public.banner_analytics 
  WHERE date = target_date;
  
  -- Inserir métricas agregadas sem a coluna metadata
  INSERT INTO public.banner_analytics (
    banner_id, 
    user_id, 
    date, 
    impressions, 
    clicks, 
    conversions
  )
  SELECT 
    bi.banner_id,
    bi.user_id,
    target_date,
    COUNT(*) FILTER (WHERE bi.interaction_type = 'view') as impressions,
    COUNT(*) FILTER (WHERE bi.interaction_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE bi.interaction_type = 'conversion') as conversions
  FROM public.banner_interactions bi
  WHERE DATE(bi.created_at) = target_date
  GROUP BY bi.banner_id, bi.user_id;
  
  GET DIAGNOSTICS processed_records = ROW_COUNT;
  
  result := json_build_object(
    'success', true,
    'date', target_date,
    'processed_records', processed_records,
    'message', 'Métricas agregadas com sucesso'
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_plan_week(plan_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_meals_for_today(p_user_id uuid)
RETURNS TABLE(meal_id uuid, meal_name text, meal_time time without time zone, meal_type text, calories integer, protein numeric, carbs numeric, fat numeric, foods jsonb, is_logged boolean, log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;