-- ============================================
-- CORREÇÃO: Search Path Mutable em Funções
-- ============================================

-- Recriar funções com search_path definido
CREATE OR REPLACE FUNCTION calculate_monthly_rankings()
RETURNS void AS $$
DECLARE
  current_month date := DATE_TRUNC('month', CURRENT_DATE)::date;
BEGIN
  DELETE FROM monthly_rankings WHERE month = current_month;
  
  INSERT INTO monthly_rankings (user_id, teacher_id, position, total_points, month)
  SELECT 
    up.user_id,
    s.teacher_id,
    ROW_NUMBER() OVER (PARTITION BY s.teacher_id ORDER BY up.total_points DESC) as position,
    up.total_points,
    current_month
  FROM user_points up
  INNER JOIN students s ON s.user_id = up.user_id
  WHERE s.teacher_id IS NOT NULL
    AND up.total_points > 0
  ORDER BY s.teacher_id, up.total_points DESC;
  
  RAISE NOTICE 'Rankings calculated for month: %', current_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar trigger function com search_path
CREATE OR REPLACE FUNCTION trigger_recalculate_rankings()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_monthly_rankings();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;