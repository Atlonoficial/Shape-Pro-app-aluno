-- FASE 1: CORREÇÃO CRÍTICA - Remover referências incorretas da função get_meals_for_today_v2
CREATE OR REPLACE FUNCTION public.get_meals_for_today_v2(p_user_id uuid)
RETURNS TABLE(meal_plan_item_id text, meal_name text, meal_time time without time zone, meal_type text, calories integer, protein numeric, carbs numeric, fat numeric, foods jsonb, is_logged boolean, log_id uuid, meal_plan_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  active_plan_id UUID;
  plan_data JSONB;
  meal_item JSONB;
  meal_key TEXT;
BEGIN
  -- Buscar o meal plan ativo do usuário (CORRIGIDO - removendo start_date e end_date)
  SELECT mp.id, mp.meals_data INTO active_plan_id, plan_data
  FROM meal_plans mp
  WHERE (mp.assigned_students IS NULL OR p_user_id = ANY(mp.assigned_students) OR mp.created_by = p_user_id)
    AND mp.status = 'active'
  ORDER BY mp.created_at DESC
  LIMIT 1;
  
  -- Log para debug
  RAISE NOTICE 'Found active plan ID: % for user: %', active_plan_id, p_user_id;
  
  -- Se não encontrou plano ativo, retorna vazio
  IF active_plan_id IS NULL THEN
    RAISE NOTICE 'No active meal plan found for user: %', p_user_id;
    RETURN;
  END IF;
  
  -- Log dos dados do plano
  RAISE NOTICE 'Plan data: %', plan_data;
  
  -- Percorrer todas as refeições no meals_data
  FOR meal_key, meal_item IN SELECT * FROM jsonb_each(plan_data) LOOP
    -- Verificar se o item tem as propriedades de uma refeição
    IF meal_item ? 'name' AND meal_item ? 'time' THEN
      meal_plan_item_id := meal_key;
      meal_name := meal_item->>'name';
      meal_time := (meal_item->>'time')::TIME;
      meal_type := COALESCE(meal_item->>'meal_type', meal_item->>'type', 'meal');
      calories := COALESCE((meal_item->>'calories')::INTEGER, 0);
      protein := COALESCE((meal_item->>'protein')::NUMERIC, 0);
      carbs := COALESCE((meal_item->>'carbs')::NUMERIC, 0);
      fat := COALESCE((meal_item->>'fat')::NUMERIC, 0);
      foods := COALESCE(meal_item->'foods', '[]'::jsonb);
      meal_plan_id := active_plan_id;
      
      -- Log da refeição processada
      RAISE NOTICE 'Processing meal: % - %', meal_key, meal_name;
      
      -- Verificar se já foi logado hoje
      SELECT 
        (ml.consumed IS NOT NULL AND ml.consumed = true) as logged,
        ml.id
      INTO is_logged, log_id
      FROM meal_logs ml
      WHERE ml.user_id = p_user_id 
        AND ml.meal_plan_id = active_plan_id
        AND ml.meal_plan_item_id = meal_key
        AND DATE(ml.date) = CURRENT_DATE
      LIMIT 1;
      
      -- Se não encontrou log, definir como não logado
      IF is_logged IS NULL THEN
        is_logged := FALSE;
        log_id := NULL;
      END IF;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Finished processing meals for user: %', p_user_id;
END;
$function$;