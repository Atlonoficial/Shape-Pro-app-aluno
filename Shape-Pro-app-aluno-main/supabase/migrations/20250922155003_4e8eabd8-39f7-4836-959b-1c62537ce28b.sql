-- Primeiro, vamos verificar a estrutura atual da tabela meal_logs
-- e fazer as correções necessárias

-- 1. Remover foreign key constraint se existir (para evitar problemas)
ALTER TABLE IF EXISTS public.meal_logs DROP CONSTRAINT IF EXISTS meal_logs_meal_id_fkey;

-- 2. Adicionar colunas necessárias se não existirem
ALTER TABLE public.meal_logs 
ADD COLUMN IF NOT EXISTS meal_plan_id UUID,
ADD COLUMN IF NOT EXISTS meal_plan_item_id TEXT,
ADD COLUMN IF NOT EXISTS meal_name TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_meal_logs_meal_plan_id ON public.meal_logs(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_meal_plan_item_id ON public.meal_logs(meal_plan_item_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, date);

-- 4. Função para buscar refeições do dia baseada no meal plan ativo
CREATE OR REPLACE FUNCTION public.get_meals_for_today_v2(p_user_id UUID)
RETURNS TABLE(
  meal_plan_item_id TEXT,
  meal_name TEXT,
  meal_time TIME,
  meal_type TEXT,
  calories INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  foods JSONB,
  is_logged BOOLEAN,
  log_id UUID,
  meal_plan_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  active_plan_id UUID;
  plan_data JSONB;
  meal_item JSONB;
  meal_key TEXT;
BEGIN
  -- Buscar o meal plan ativo do usuário
  SELECT np.id, np.meal_data INTO active_plan_id, plan_data
  FROM nutrition_plans np
  WHERE (np.assigned_to IS NULL OR p_user_id = ANY(np.assigned_to) OR np.created_by = p_user_id)
    AND (np.start_date IS NULL OR np.start_date <= CURRENT_DATE)
    AND (np.end_date IS NULL OR np.end_date >= CURRENT_DATE)
    AND np.status = 'active'
  ORDER BY np.created_at DESC
  LIMIT 1;
  
  -- Se não encontrou plano ativo, retorna vazio
  IF active_plan_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Percorrer todas as refeições no meal_data
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
END;
$function$;