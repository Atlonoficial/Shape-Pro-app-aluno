-- Corrigir a função get_meals_for_today para lidar com assigned_to como array
CREATE OR REPLACE FUNCTION get_meals_for_today(p_user_id UUID)
RETURNS TABLE(
  meal_id UUID,
  meal_name TEXT,
  meal_time TIME,
  meal_type TEXT,
  calories INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  foods JSONB,
  is_logged BOOLEAN,
  log_id UUID
) AS $$
DECLARE
  plan_id UUID;
  current_week INTEGER;
  today_dow INTEGER;
BEGIN
  -- Buscar plano ativo do usuário (corrigido para array)
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
  
  -- Calcular semana atual e dia da semana
  current_week := get_current_plan_week(plan_id);
  today_dow := EXTRACT(dow FROM CURRENT_DATE);
  
  -- Buscar refeições com informações de log
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
    -- Tentar buscar da rotação primeiro
    SELECT mr.meal_id
    FROM meal_rotations mr
    WHERE mr.nutrition_plan_id = plan_id
      AND mr.week_number = current_week
      AND mr.day_of_week = today_dow
    
    UNION ALL
    
    -- Se não há rotação, usar refeições padrão do plano
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;