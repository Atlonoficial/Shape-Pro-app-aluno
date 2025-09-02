-- Limpar registros duplicados de gamificação (opcional - para limpar dados existentes)
-- Esta query remove entradas duplicadas baseada nos mesmos critérios da função v3

WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, activity_type, DATE(created_at), 
           CASE 
             WHEN activity_type = 'meal_logged' THEN metadata->>'meal_id'||metadata->>'date'
             WHEN activity_type = 'progress_logged' THEN metadata->>'progress_type'
             ELSE activity_type
           END
           ORDER BY created_at DESC
         ) as rn
  FROM gamification_activities
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' -- Só limpar últimos 30 dias
)
DELETE FROM gamification_activities 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Atualizar triggers existentes para usar a nova função v3
DROP TRIGGER IF EXISTS auto_award_meal_points_trigger ON meal_logs;
DROP TRIGGER IF EXISTS auto_award_progress_points_trigger ON progress;

-- Recriar triggers com função v3
CREATE OR REPLACE FUNCTION auto_award_meal_points_v3()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se deve dar pontos (só quando consumed = true)
  IF TG_OP = 'INSERT' AND NEW.consumed = true THEN
    PERFORM award_points_enhanced_v3(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.consumed = true AND (OLD.consumed IS NULL OR OLD.consumed = false) THEN
    PERFORM award_points_enhanced_v3(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auto_award_progress_points_v3()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM award_points_enhanced_v3(
    NEW.user_id,
    'progress_logged',
    'Progresso atualizado: ' || NEW.type,
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value, 'unit', NEW.unit)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar triggers
CREATE TRIGGER auto_award_meal_points_trigger_v3
  AFTER INSERT OR UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_meal_points_v3();

CREATE TRIGGER auto_award_progress_points_trigger_v3
  AFTER INSERT OR UPDATE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_progress_points_v3();