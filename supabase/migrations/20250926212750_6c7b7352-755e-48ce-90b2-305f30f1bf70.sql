-- Corrigir função RPC de feedback com transações atômicas e validações robustas

-- Primeiro, dropar função anterior se existir
DROP FUNCTION IF EXISTS public.submit_feedback_with_points_v3(uuid, uuid, jsonb);

-- Criar função RPC otimizada v3 com correções críticas
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points_v3(
  p_student_id UUID,
  p_teacher_id UUID, 
  p_feedback_data JSONB
)
RETURNS JSONB
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
  v_teacher_exists BOOLEAN := FALSE;
  v_student_relationship BOOLEAN := FALSE;
BEGIN
  -- Log de entrada para debugging
  RAISE NOTICE 'submit_feedback_v3: Starting for student=%, teacher=%', p_student_id, p_teacher_id;

  -- VALIDAÇÃO 1: Verificar se o teacher existe e é válido
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_teacher_id AND user_type = 'teacher'
  ) INTO v_teacher_exists;
  
  IF NOT v_teacher_exists THEN
    RAISE NOTICE 'submit_feedback_v3: Teacher % not found or not valid', p_teacher_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Professor não encontrado ou inválido',
      'error_type', 'teacher_not_found'
    );
  END IF;

  -- VALIDAÇÃO 2: Verificar relacionamento teacher/student
  SELECT EXISTS (
    SELECT 1 FROM public.students 
    WHERE user_id = p_student_id AND teacher_id = p_teacher_id
  ) INTO v_student_relationship;
  
  IF NOT v_student_relationship THEN
    RAISE NOTICE 'submit_feedback_v3: No relationship found between student=% and teacher=%', p_student_id, p_teacher_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Relacionamento professor-aluno não encontrado',
      'error_type', 'relationship_not_found'
    );
  END IF;

  -- VALIDAÇÃO 3: Buscar configurações de feedback do professor
  SELECT COALESCE(feedback_frequency, 'weekly') INTO v_frequency
  FROM public.teacher_feedback_settings 
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

  RAISE NOTICE 'submit_feedback_v3: Checking period % to % with frequency %', v_period_start, v_period_end, v_frequency;

  -- VALIDAÇÃO 4: Verificar se já existe feedback no período
  SELECT * INTO v_existing_feedback
  FROM public.feedbacks
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND type = 'periodic_feedback'
    AND DATE(created_at) >= v_period_start
    AND DATE(created_at) <= v_period_end;
    
  IF FOUND THEN
    RAISE NOTICE 'submit_feedback_v3: Feedback already exists for this period, id=%', v_existing_feedback.id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feedback já enviado neste período',
      'duplicate', true,
      'existing_feedback_id', v_existing_feedback.id
    );
  END IF;

  -- INÍCIO DA TRANSAÇÃO ATÔMICA
  BEGIN
    -- Inserir feedback
    INSERT INTO public.feedbacks (
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

    RAISE NOTICE 'submit_feedback_v3: Feedback inserted with ID=%', v_feedback_id;

    -- Dar pontos por feedback usando a função melhorada
    SELECT * INTO v_points_result
    FROM public.award_points_enhanced_v3(
      p_student_id,
      'periodic_feedback',
      'Feedback periódico enviado',
      jsonb_build_object(
        'teacher_id', p_teacher_id,
        'feedback_id', v_feedback_id,
        'frequency', v_frequency,
        'period_start', v_period_start,
        'period_end', v_period_end,
        'type', 'periodic_feedback'
      ),
      NULL -- Usar pontos padrão das configurações
    );

    RAISE NOTICE 'submit_feedback_v3: Points result=%', v_points_result;

    -- Verificar se a gamificação funcionou
    IF v_points_result IS NULL OR NOT (v_points_result->>'success')::boolean THEN
      RAISE WARNING 'submit_feedback_v3: Points awarding failed or returned null';
      -- Não falhar a operação inteira por causa dos pontos
      v_points_result := jsonb_build_object(
        'success', true,
        'points_awarded', 0,
        'message', 'Pontos não puderam ser concedidos'
      );
    END IF;

    -- Commit implícito - sucesso
    RETURN jsonb_build_object(
      'success', true,
      'feedback_id', v_feedback_id,
      'points_result', v_points_result,
      'points_awarded', COALESCE((v_points_result->>'points_awarded')::integer, 0),
      'message', 'Feedback enviado com sucesso!'
    );

  EXCEPTION WHEN OTHERS THEN
    -- Rollback automático em caso de erro
    RAISE NOTICE 'submit_feedback_v3: Transaction error - %, SQLSTATE=%', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'message', 'Erro interno ao processar feedback'
    );
  END;

END;
$$;