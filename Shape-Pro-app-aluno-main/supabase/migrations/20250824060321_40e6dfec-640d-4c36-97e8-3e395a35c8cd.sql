-- Primeiro, adicionar coluna meal_ids à tabela nutrition_plans
ALTER TABLE public.nutrition_plans 
ADD COLUMN IF NOT EXISTS meal_ids JSONB DEFAULT '[]'::jsonb;

-- Adicionar colunas necessárias à tabela meals existente
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'meal',
ADD COLUMN IF NOT EXISTS foods JSONB DEFAULT '[]'::jsonb;

-- Alterar coluna time para usar TIME ao invés de TEXT se necessário
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.meals ALTER COLUMN time TYPE TIME USING time::TIME;
  EXCEPTION WHEN OTHERS THEN
    -- Se já é TIME, continuar
    NULL;
  END;
END $$;