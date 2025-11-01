-- ============================================
-- FASE 2: CORREÇÃO DE RANKINGS AUTOMÁTICOS
-- ============================================

-- Função para calcular rankings do mês atual
CREATE OR REPLACE FUNCTION calculate_monthly_rankings()
RETURNS void AS $$
DECLARE
  current_month date := DATE_TRUNC('month', CURRENT_DATE)::date;
BEGIN
  -- Deletar rankings antigos do mês
  DELETE FROM monthly_rankings WHERE month = current_month;
  
  -- Calcular rankings por teacher com validação
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
  
  RAISE NOTICE 'Rankings calculated for month: %, Total entries: %', current_month, (SELECT COUNT(*) FROM monthly_rankings WHERE month = current_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular rankings quando pontos mudam
CREATE OR REPLACE FUNCTION trigger_recalculate_rankings()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_monthly_rankings();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger se já existir
DROP TRIGGER IF EXISTS recalculate_rankings_on_points_change ON user_points;

-- Criar trigger
CREATE TRIGGER recalculate_rankings_on_points_change
AFTER INSERT OR UPDATE OF total_points ON user_points
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_recalculate_rankings();

-- Executar cálculo inicial
SELECT calculate_monthly_rankings();

-- Verificar resultados
DO $$
DECLARE
  ranking_count integer;
BEGIN
  SELECT COUNT(*) INTO ranking_count FROM monthly_rankings WHERE month = DATE_TRUNC('month', CURRENT_DATE)::date;
  RAISE NOTICE '✅ Rankings criados: % entradas', ranking_count;
END $$;