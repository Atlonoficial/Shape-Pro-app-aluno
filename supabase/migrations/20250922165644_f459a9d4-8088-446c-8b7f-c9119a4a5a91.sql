-- CORREÇÃO DE CONFLITO DE NOMES: usar prefixos v_ para variáveis
CREATE OR REPLACE FUNCTION public.get_meals_for_today_v2(p_user_id uuid)
RETURNS TABLE(meal_plan_item_id text, meal_name text, meal_time time without time zone, meal_type text, calories integer, protein numeric, carbs numeric, fat numeric, foods jsonb, is_logged boolean, log_id uuid, meal_plan_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_active_plan_id UUID;
  v_plan_data JSONB;
  v_meal_item JSONB;
  v_meal_index INTEGER := 0;
  v_meal_plan_item_id TEXT;
  v_meal_name TEXT;
  v_meal_time TIME;
  v_meal_type TEXT;
  v_calories INTEGER;
  v_protein NUMERIC;
  v_carbs NUMERIC;
  v_fat NUMERIC;
  v_foods JSONB;
  v_is_logged BOOLEAN;
  v_log_id UUID;
BEGIN
  -- Buscar o meal plan ativo do usuário
  SELECT mp.id, mp.meals_data INTO v_active_plan_id, v_plan_data
  FROM meal_plans mp
  WHERE (mp.assigned_students IS NULL OR p_user_id = ANY(mp.assigned_students) OR mp.created_by = p_user_id)
    AND mp.status = 'active'
  ORDER BY mp.created_at DESC
  LIMIT 1;
  
  -- Log para debug
  RAISE NOTICE 'Found active plan ID: % for user: %', v_active_plan_id, p_user_id;
  
  -- Se não encontrou plano ativo, retorna vazio
  IF v_active_plan_id IS NULL THEN
    RAISE NOTICE 'No active meal plan found for user: %', p_user_id;
    RETURN;
  END IF;
  
  -- Log dos dados do plano
  RAISE NOTICE 'Plan data type: %, content: %', jsonb_typeof(v_plan_data), v_plan_data;
  
  -- Verificar se meals_data é um array
  IF jsonb_typeof(v_plan_data) = 'array' THEN
    -- Percorrer array de refeições
    FOR v_meal_index IN 0..jsonb_array_length(v_plan_data)-1 LOOP
      v_meal_item := v_plan_data->v_meal_index;
      
      -- Verificar se o item tem as propriedades de uma refeição
      IF v_meal_item ? 'name' AND v_meal_item ? 'time' THEN
        v_meal_plan_item_id := COALESCE(v_meal_item->>'id', 'meal_' || v_meal_index::text);
        v_meal_name := v_meal_item->>'name';
        v_meal_time := (v_meal_item->>'time')::TIME;
        v_meal_type := COALESCE(v_meal_item->>'meal_type', v_meal_item->>'type', 'meal');
        v_calories := COALESCE((v_meal_item->>'calories')::INTEGER, 0);
        v_protein := COALESCE((v_meal_item->>'protein')::NUMERIC, 0);
        v_carbs := COALESCE((v_meal_item->>'carbs')::NUMERIC, 0);
        v_fat := COALESCE((v_meal_item->>'fat')::NUMERIC, 0);
        v_foods := COALESCE(v_meal_item->'foods', '[]'::jsonb);
        
        -- Log da refeição processada
        RAISE NOTICE 'Processing meal [%]: % - %', v_meal_index, v_meal_plan_item_id, v_meal_name;
        
        -- Verificar se já foi logado hoje
        SELECT 
          (ml.consumed IS NOT NULL AND ml.consumed = true),
          ml.id
        INTO v_is_logged, v_log_id
        FROM meal_logs ml
        WHERE ml.user_id = p_user_id 
          AND ml.meal_plan_id = v_active_plan_id
          AND ml.meal_plan_item_id = v_meal_plan_item_id
          AND DATE(ml.date) = CURRENT_DATE
        LIMIT 1;
        
        -- Se não encontrou log, definir como não logado
        IF v_is_logged IS NULL THEN
          v_is_logged := FALSE;
          v_log_id := NULL;
        END IF;
        
        -- Retornar a linha
        meal_plan_item_id := v_meal_plan_item_id;
        meal_name := v_meal_name;
        meal_time := v_meal_time;
        meal_type := v_meal_type;
        calories := v_calories;
        protein := v_protein;
        carbs := v_carbs;
        fat := v_fat;
        foods := v_foods;
        is_logged := v_is_logged;
        log_id := v_log_id;
        meal_plan_id := v_active_plan_id;
        
        RETURN NEXT;
      END IF;
    END LOOP;
  ELSIF jsonb_typeof(v_plan_data) = 'object' THEN
    -- Código original para objetos (fallback)
    DECLARE
      meal_key TEXT;
    BEGIN
      FOR meal_key, v_meal_item IN SELECT * FROM jsonb_each(v_plan_data) LOOP
        IF v_meal_item ? 'name' AND v_meal_item ? 'time' THEN
          v_meal_plan_item_id := meal_key;
          v_meal_name := v_meal_item->>'name';
          v_meal_time := (v_meal_item->>'time')::TIME;
          v_meal_type := COALESCE(v_meal_item->>'meal_type', v_meal_item->>'type', 'meal');
          v_calories := COALESCE((v_meal_item->>'calories')::INTEGER, 0);
          v_protein := COALESCE((v_meal_item->>'protein')::NUMERIC, 0);
          v_carbs := COALESCE((v_meal_item->>'carbs')::NUMERIC, 0);
          v_fat := COALESCE((v_meal_item->>'fat')::NUMERIC, 0);
          v_foods := COALESCE(v_meal_item->'foods', '[]'::jsonb);
          
          -- Verificar se já foi logado hoje
          SELECT 
            (ml.consumed IS NOT NULL AND ml.consumed = true),
            ml.id
          INTO v_is_logged, v_log_id
          FROM meal_logs ml
          WHERE ml.user_id = p_user_id 
            AND ml.meal_plan_id = v_active_plan_id
            AND ml.meal_plan_item_id = v_meal_plan_item_id
            AND DATE(ml.date) = CURRENT_DATE
          LIMIT 1;
          
          IF v_is_logged IS NULL THEN
            v_is_logged := FALSE;
            v_log_id := NULL;
          END IF;
          
          -- Retornar a linha
          meal_plan_item_id := v_meal_plan_item_id;
          meal_name := v_meal_name;
          meal_time := v_meal_time;
          meal_type := v_meal_type;
          calories := v_calories;
          protein := v_protein;
          carbs := v_carbs;
          fat := v_fat;
          foods := v_foods;
          is_logged := v_is_logged;
          log_id := v_log_id;
          meal_plan_id := v_active_plan_id;
          
          RETURN NEXT;
        END IF;
      END LOOP;
    END;
  ELSE
    RAISE NOTICE 'Meals data is not array or object: %', jsonb_typeof(v_plan_data);
  END IF;
  
  RAISE NOTICE 'Finished processing meals for user: %', p_user_id;
END;
$function$;