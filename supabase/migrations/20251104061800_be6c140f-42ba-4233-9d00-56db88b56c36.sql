-- ============================================================================
-- BUILD 52: RPC Functions para Buscar Planos do Usuário
-- ============================================================================
-- Cria functions SQL nativas que usam o operador = ANY() corretamente
-- para filtrar workout_plans e meal_plans por assigned_students (UUID[])
-- ============================================================================

-- 1. RPC para buscar workout plans do usuário
CREATE OR REPLACE FUNCTION public.get_user_workout_plans(p_user_id UUID)
RETURNS SETOF workout_plans
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM workout_plans
  WHERE status = 'active'
    AND (created_by = p_user_id OR p_user_id = ANY(assigned_students))
  ORDER BY created_at DESC
  LIMIT 50;
$$;

-- 2. RPC para buscar meal plans do usuário
CREATE OR REPLACE FUNCTION public.get_user_meal_plans(p_user_id UUID)
RETURNS SETOF meal_plans
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM meal_plans
  WHERE status = 'active'
    AND (created_by = p_user_id OR p_user_id = ANY(assigned_students))
  ORDER BY created_at DESC
  LIMIT 10;
$$;

-- Comentários:
-- - Operador = ANY() é nativo do PostgreSQL e funciona perfeitamente com UUID[]
-- - SECURITY DEFINER permite que a function execute com privilégios do owner
-- - Limite de 50 para workouts e 10 para meal plans previne sobrecarga