-- Adicionar colunas necessárias à tabela meals existente
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'meal',
ADD COLUMN IF NOT EXISTS foods JSONB DEFAULT '[]'::jsonb;

-- Alterar coluna time para usar TIME ao invés de TEXT
ALTER TABLE public.meals 
ALTER COLUMN time TYPE TIME USING time::TIME;

-- Migrar dados existentes das refeições dos planos nutricionais
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
  -- Processar cada plano nutricional existente que ainda não foi migrado
  FOR plan_record IN 
    SELECT id, meals, created_by 
    FROM nutrition_plans 
    WHERE meals IS NOT NULL 
      AND jsonb_array_length(meals) > 0
      AND (meal_ids IS NULL OR jsonb_array_length(meal_ids) = 0)
  LOOP
    new_meal_ids := ARRAY[]::UUID[];
    meal_index := 1;
    
    -- Processar cada refeição do plano
    FOR meal_record IN 
      SELECT * FROM jsonb_array_elements(plan_record.meals)
    LOOP
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
        meal_name := COALESCE((meal_record.value->>'name')::TEXT, meal_type_names[LEAST(meal_index, 5)]);
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