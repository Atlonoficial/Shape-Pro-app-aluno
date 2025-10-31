-- ============================================
-- FASE 2: CRIAR ÍNDICES ESTRATÉGICOS
-- ============================================

-- Resolver queries lentas em profiles (user_type é muito consultado)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_id 
ON profiles(user_type, id) 
WHERE user_type IS NOT NULL;

-- Resolver queries lentas em students (teacher-student lookup)
CREATE INDEX IF NOT EXISTS idx_students_teacher_user 
ON students(teacher_id, user_id);

CREATE INDEX IF NOT EXISTS idx_students_active 
ON students(teacher_id, membership_status) 
WHERE membership_status = 'active';

-- Resolver queries lentas em gamification
CREATE INDEX IF NOT EXISTS idx_gamification_user_date 
ON gamification_activities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_points_lookup 
ON user_points(user_id, updated_at DESC);

-- ============================================
-- FASE 3: CONFIGURAR AUTOVACUUM AGRESSIVO
-- ============================================

-- profiles (tabela mais acessada)
ALTER TABLE profiles SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10
);

-- students
ALTER TABLE students SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- gamification_activities (muitos INSERTs)
ALTER TABLE gamification_activities SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- payment_transactions
ALTER TABLE payment_transactions SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- ============================================
-- FASE 5: FUNÇÕES DE MONITORAMENTO
-- ============================================

-- Função para verificar dead rows
CREATE OR REPLACE FUNCTION check_dead_rows()
RETURNS TABLE (
  tablename text,
  live_rows bigint,
  dead_rows bigint,
  dead_ratio numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_user_tables.relname::text,
    pg_stat_user_tables.n_live_tup,
    pg_stat_user_tables.n_dead_tup,
    ROUND(100.0 * pg_stat_user_tables.n_dead_tup / NULLIF(pg_stat_user_tables.n_live_tup + pg_stat_user_tables.n_dead_tup, 0), 2)
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  AND n_live_tup + n_dead_tup > 0
  ORDER BY 4 DESC NULLS LAST;
END;
$$;