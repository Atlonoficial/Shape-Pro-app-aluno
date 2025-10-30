-- Criar tabela de refeições com UUIDs apropriados
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  time TIME NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  foods JSONB DEFAULT '[]'::jsonb,
  meal_type TEXT NOT NULL, -- breakfast, morning_snack, lunch, afternoon_snack, dinner
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Habilitar RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados visualizarem refeições
CREATE POLICY "Users can view meals"
ON public.meals FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para professores criarem refeições
CREATE POLICY "Teachers can create meals"
ON public.meals FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Política para professores gerenciarem suas próprias refeições
CREATE POLICY "Teachers can manage own meals"
ON public.meals FOR ALL
USING (auth.uid() = created_by);

-- Criar tabela para rotação de refeições (variação semanal/mensal)
CREATE TABLE IF NOT EXISTS public.meal_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID NOT NULL,
  meal_type TEXT NOT NULL,
  week_number INTEGER NOT NULL DEFAULT 1,
  day_of_week INTEGER NOT NULL, -- 0=domingo, 1=segunda, etc
  meal_id UUID REFERENCES meals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(nutrition_plan_id, meal_type, week_number, day_of_week)
);

-- Habilitar RLS para meal_rotations
ALTER TABLE public.meal_rotations ENABLE ROW LEVEL SECURITY;

-- Política para visualizar rotações
CREATE POLICY "Users can view meal rotations"
ON public.meal_rotations FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para professores gerenciarem rotações
CREATE POLICY "Teachers can manage meal rotations"
ON public.meal_rotations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM nutrition_plans np
    WHERE np.id = nutrition_plan_id 
    AND np.created_by = auth.uid()
  )
);

-- Adicionar colunas à tabela nutrition_plans para suportar rotações
ALTER TABLE public.nutrition_plans 
ADD COLUMN IF NOT EXISTS rotation_weeks INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS week_start_date DATE DEFAULT CURRENT_DATE;

-- Função para calcular semana atual do plano baseada na data de início
CREATE OR REPLACE FUNCTION get_current_plan_week(plan_id UUID)
RETURNS INTEGER AS $$
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
  
  -- Calcular semana atual considerando rotação
  RETURN (weeks_passed % rotation_weeks) + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;