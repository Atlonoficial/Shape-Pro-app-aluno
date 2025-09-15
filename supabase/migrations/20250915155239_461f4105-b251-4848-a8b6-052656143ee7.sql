-- Primeiro, remover TODOS os triggers v2 existentes
DROP TRIGGER IF EXISTS auto_award_meal_points_insert_trigger_v2 ON meal_logs CASCADE;
DROP TRIGGER IF EXISTS auto_award_meal_points_update_trigger_v2 ON meal_logs CASCADE;
DROP TRIGGER IF EXISTS auto_award_progress_points_v2_trigger ON progress CASCADE;

-- Agora remover as funções v2 sem dependências
DROP FUNCTION IF EXISTS auto_award_meal_points_v2() CASCADE;
DROP FUNCTION IF EXISTS auto_award_progress_points_v2() CASCADE;

-- Verificar se há outras versões antigas
DROP FUNCTION IF EXISTS award_points_enhanced_v2(uuid, text, text, jsonb, integer) CASCADE;