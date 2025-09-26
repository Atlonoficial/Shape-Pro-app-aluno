-- ==========================================
-- FASE 1: CORREÇÃO CRÍTICA DA FUNÇÃO RPC
-- ==========================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.submit_feedback_with_points(uuid, uuid, jsonb);

-- Criar função RPC otimizada com permissões corretas
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points_v2(
  p_student_id uuid,
  p_teacher_id uuid,
  p_feedback_data jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback_id UUID;
  v_points_result JSONB;
  v_existing_feedback RECORD;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_today DATE := CURRENT_DATE;
  v_frequency TEXT;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Log de entrada para debugging
  RAISE NOTICE 'Starting feedback submission for student: %, teacher: %', p_student_id, p_teacher_id;

  -- Validar relacionamento teacher/student primeiro
  IF NOT EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = p_student_id AND teacher_id = p_teacher_id
  ) THEN
    RAISE NOTICE 'Invalid teacher-student relationship: % -> %', p_student_id, p_teacher_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Relacionamento professor-aluno não encontrado',
      'error_type', 'relationship'
    );
  END IF;

  -- Buscar frequência de feedback do professor
  SELECT feedback_frequency INTO v_frequency
  FROM teacher_feedback_settings 
  WHERE teacher_id = p_teacher_id;
  
  -- Usar frequência padrão se não encontrada
  IF v_frequency IS NULL THEN
    v_frequency := 'weekly';
  END IF;

  -- Determinar período baseado na frequência
  CASE v_frequency
    WHEN 'daily' THEN
      v_period_start := v_today;
      v_period_end := v_today;
    WHEN 'weekly' THEN  
      v_period_start := v_week_start;
      v_period_end := v_week_start + INTERVAL '6 days';
    WHEN 'biweekly' THEN
      v_period_start := v_today - INTERVAL '14 days';
      v_period_end := v_today;
    WHEN 'monthly' THEN
      v_period_start := DATE_TRUNC('month', v_today)::DATE;
      v_period_end := (DATE_TRUNC('month', v_today) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE
      v_period_start := v_week_start;
      v_period_end := v_week_start + INTERVAL '6 days';
  END CASE;

  RAISE NOTICE 'Checking period from % to % with frequency %', v_period_start, v_period_end, v_frequency;

  -- Verificar se já existe feedback no período
  SELECT * INTO v_existing_feedback
  FROM feedbacks
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND type = 'periodic_feedback'
    AND DATE(created_at) >= v_period_start
    AND DATE(created_at) <= v_period_end;
    
  IF FOUND THEN
    RAISE NOTICE 'Feedback already exists for this period';
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feedback já enviado neste período',
      'duplicate', true,
      'existing_feedback_id', v_existing_feedback.id
    );
  END IF;

  -- Inserir feedback
  INSERT INTO feedbacks (
    student_id,
    teacher_id,
    type,
    rating,
    message,
    metadata
  ) VALUES (
    p_student_id,
    p_teacher_id,
    'periodic_feedback',
    COALESCE((p_feedback_data->>'rating')::integer, 5),
    COALESCE(p_feedback_data->>'message', ''),
    COALESCE(p_feedback_data->'metadata', '{}'::jsonb)
  ) RETURNING id INTO v_feedback_id;

  RAISE NOTICE 'Feedback inserted with ID: %', v_feedback_id;

  -- Dar pontos por feedback usando a função melhorada
  SELECT * INTO v_points_result
  FROM award_points_enhanced_v3(
    p_student_id,
    'periodic_feedback',
    'Feedback enviado ao professor',
    jsonb_build_object(
      'teacher_id', p_teacher_id,
      'feedback_id', v_feedback_id,
      'frequency', v_frequency,
      'period_start', v_period_start,
      'period_end', v_period_end
    )
  );

  RAISE NOTICE 'Points result: %', v_points_result;

  RETURN jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id,
    'points_result', v_points_result,
    'points_awarded', COALESCE(v_points_result->>'points_awarded', '0')::integer,
    'message', 'Feedback enviado com sucesso!'
  );

EXCEPTION WHEN OTHERS THEN
  -- Log detalhado do erro
  RAISE NOTICE 'Error in submit_feedback_with_points_v2: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'message', 'Erro interno ao processar feedback'
  );
END;
$$;