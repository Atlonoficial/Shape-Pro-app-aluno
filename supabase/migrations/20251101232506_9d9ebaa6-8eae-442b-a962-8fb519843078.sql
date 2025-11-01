-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS Policies - meal_logs
-- Restringir INSERT e UPDATE apenas para usuários autenticados
-- ============================================

-- Remover policies antigas que permitem 'public'
DROP POLICY IF EXISTS "Users can create own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can update own meal logs" ON meal_logs;

-- Criar policies SEGURAS apenas para 'authenticated'
CREATE POLICY "Users can create own meal logs"
  ON meal_logs
  FOR INSERT
  TO authenticated  -- ⚠️ CRÍTICO: Apenas usuários autenticados
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs
  FOR UPDATE
  TO authenticated  -- ⚠️ CRÍTICO: Apenas usuários autenticados
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CORREÇÃO DE SEGURANÇA: Search Path em Funções
-- Adicionar SET search_path = public para prevenir schema hijacking
-- Usar CREATE OR REPLACE mantendo os nomes originais dos parâmetros
-- ============================================

-- Atualizar função is_teacher_of com search_path (mantendo nomes originais)
CREATE OR REPLACE FUNCTION is_teacher_of(_teacher_id uuid, _student_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students 
    WHERE students.teacher_id = _teacher_id
      AND students.user_id = _student_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atualizar função award_points_enhanced com search_path
CREATE OR REPLACE FUNCTION award_points_enhanced(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_custom_points integer DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_points integer;
BEGIN
  -- Determinar pontos baseado no tipo de atividade
  v_points := COALESCE(p_custom_points, 10);
  
  -- Inserir ou atualizar pontos do usuário
  INSERT INTO user_points (user_id, total_points)
  VALUES (p_user_id, v_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + v_points,
    last_activity_date = NOW();
  
  -- Registrar atividade
  INSERT INTO gamification_activities (
    user_id, 
    activity_type, 
    description,
    points_earned
  )
  VALUES (
    p_user_id, 
    p_activity_type, 
    p_description,
    v_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;