-- Migrar dados existentes das refeições dos planos nutricionais para a nova estrutura
DO $$
DECLARE
  plan_record RECORD;
  meal_record RECORD;
  new_meal_id UUID;
  meal_types TEXT[] := ARRAY['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];
  meal_type_names TEXT[] := ARRAY['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];
  meal_index INTEGER;
  new_meal_ids UUID[];
BEGIN
  -- Processar cada plano nutricional existente
  FOR plan_record IN 
    SELECT id, meals, created_by 
    FROM nutrition_plans 
    WHERE meals IS NOT NULL AND jsonb_array_length(meals) > 0
  LOOP
    new_meal_ids := ARRAY[]::UUID[];
    meal_index := 1;
    
    -- Processar cada refeição do plano
    FOR meal_record IN 
      SELECT * FROM jsonb_array_elements(plan_record.meals)
    LOOP
      -- Determinar o tipo de refeição baseado na posição
      DECLARE
        meal_type_text TEXT;
        meal_name TEXT;
        meal_time TIME;
        calories_total INTEGER;
        protein_total NUMERIC := 0;
        carbs_total NUMERIC := 0;
        fat_total NUMERIC := 0;
        foods_data JSONB;
        food_item JSONB;
      BEGIN
        -- Mapear tipo de refeição
        IF meal_index <= array_length(meal_types, 1) THEN
          meal_type_text := meal_types[meal_index];
        ELSE
          meal_type_text := 'snack';
        END IF;
        
        -- Extrair dados da refeição
        meal_name := COALESCE((meal_record.value->>'name')::TEXT, meal_type_names[meal_index]);
        meal_time := COALESCE((meal_record.value->>'time')::TIME, '12:00:00');
        calories_total := COALESCE((meal_record.value->>'calories')::INTEGER, 0);
        
        -- Processar foods e calcular totais de macros
        foods_data := COALESCE(meal_record.value->'foods', '[]'::jsonb);
        
        -- Calcular totais de macronutrientes dos foods
        FOR food_item IN SELECT * FROM jsonb_array_elements(foods_data)
        LOOP
          protein_total := protein_total + COALESCE((food_item->>'proteins')::NUMERIC, 0);
          carbs_total := carbs_total + COALESCE((food_item->>'carbs')::NUMERIC, 0);
          fat_total := fat_total + COALESCE((food_item->>'fats')::NUMERIC, 0);
        END LOOP;
        
        -- Inserir nova refeição
        INSERT INTO meals (
          name, 
          time, 
          calories, 
          protein, 
          carbs, 
          fat, 
          foods, 
          meal_type, 
          created_by
        )
        VALUES (
          meal_name,
          meal_time,
          calories_total,
          protein_total,
          carbs_total,
          fat_total,
          foods_data,
          meal_type_text,
          plan_record.created_by
        )
        RETURNING id INTO new_meal_id;
        
        -- Adicionar ao array de IDs
        new_meal_ids := array_append(new_meal_ids, new_meal_id);
        
        meal_index := meal_index + 1;
      END;
    END LOOP;
    
    -- Atualizar o plano nutricional com novos IDs das refeições
    UPDATE nutrition_plans 
    SET 
      meal_ids = array_to_json(new_meal_ids)::jsonb,
      updated_at = now()
    WHERE id = plan_record.id;
    
  END LOOP;
END $$;

-- Adicionar coluna meal_ids para referenciar as novas refeições
ALTER TABLE nutrition_plans 
ADD COLUMN IF NOT EXISTS meal_ids JSONB DEFAULT '[]'::jsonb;

-- Função para obter refeições do plano baseada na semana atual
CREATE OR REPLACE FUNCTION get_plan_meals_for_date(plan_id UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  meal_id UUID,
  meal_name TEXT,
  meal_time TIME,
  meal_type TEXT,
  calories INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  foods JSONB
) AS $$
DECLARE
  current_week INTEGER;
  target_day INTEGER; -- 0=domingo, 1=segunda, etc
BEGIN
  -- Calcular semana atual do plano
  current_week := get_current_plan_week(plan_id);
  target_day := EXTRACT(dow FROM target_date);
  
  -- Tentar buscar refeições específicas da rotação para esta semana/dia
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
    m.foods
  FROM meal_rotations mr
  JOIN meals m ON m.id = mr.meal_id
  WHERE mr.nutrition_plan_id = plan_id
    AND mr.week_number = current_week
    AND mr.day_of_week = target_day
  ORDER BY m.time;
  
  -- Se não há rotação específica, usar refeições padrão do plano
  IF NOT FOUND THEN
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
      m.foods
    FROM nutrition_plans np,
         jsonb_array_elements(np.meal_ids) meal_id_json
    JOIN meals m ON m.id = (meal_id_json.value#>>'{}')::UUID
    WHERE np.id = plan_id
    ORDER BY m.time;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;