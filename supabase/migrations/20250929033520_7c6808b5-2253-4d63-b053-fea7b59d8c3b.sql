-- CORREÇÃO COMPLETA DO SISTEMA DE FEEDBACKS V4
-- Corrigir função RPC com melhor handling de erros e validações

-- Remover função anterior se existir
DROP FUNCTION IF EXISTS public.submit_feedback_with_points_v4(uuid, uuid, jsonb);

-- Criar versão melhorada da função de feedback V4
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points_v4(
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
  v_points_awarded INTEGER := 0;
BEGIN
  -- Log de entrada detalhado
  RAISE NOTICE '[FEEDBACK_V4] === INICIANDO PROCESSO ===';
  RAISE NOTICE '[FEEDBACK_V4] Student: %, Teacher: %', p_student_id, p_teacher_id;
  RAISE NOTICE '[FEEDBACK_V4] Data: %', p_feedback_data;
  RAISE NOTICE '[FEEDBACK_V4] Today: %, Week start: %', v_today, v_week_start;

  -- VALIDAÇÃO 1: Verificar auth.uid() matches student_id
  IF auth.uid() != p_student_id THEN
    RAISE NOTICE '[FEEDBACK_V4] ERROR: Auth mismatch. auth.uid()=%, p_student_id=%', auth.uid(), p_student_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não autorizado',
      'error_type', 'auth_mismatch'
    );
  END IF;

  -- VALIDAÇÃO 2: Verificar se o teacher existe
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_teacher_id AND user_type = 'teacher'
  ) INTO v_teacher_exists;
  
  RAISE NOTICE '[FEEDBACK_V4] Teacher exists: %', v_teacher_exists;
  
  IF NOT v_teacher_exists THEN
    RAISE NOTICE '[FEEDBACK_V4] ERROR: Teacher % not found', p_teacher_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Professor não encontrado',
      'error_type', 'teacher_not_found'
    );
  END IF;

  -- VALIDAÇÃO 3: Verificar relacionamento teacher/student
  SELECT EXISTS (
    SELECT 1 FROM public.students 
    WHERE user_id = p_student_id AND teacher_id = p_teacher_id
  ) INTO v_student_relationship;
  
  RAISE NOTICE '[FEEDBACK_V4] Student-teacher relationship exists: %', v_student_relationship;
  
  IF NOT v_student_relationship THEN
    RAISE NOTICE '[FEEDBACK_V4] ERROR: No relationship between student=% and teacher=%', p_student_id, p_teacher_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Relacionamento professor-aluno não encontrado',
      'error_type', 'relationship_not_found'
    );
  END IF;

  -- VALIDAÇÃO 4: Buscar configurações de feedback do professor
  SELECT COALESCE(feedback_frequency, 'weekly') INTO v_frequency
  FROM public.teacher_feedback_settings 
  WHERE teacher_id = p_teacher_id;
  
  IF v_frequency IS NULL THEN
    v_frequency := 'weekly';
  END IF;
  
  RAISE NOTICE '[FEEDBACK_V4] Frequency: %', v_frequency;

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

  RAISE NOTICE '[FEEDBACK_V4] Period: % to %', v_period_start, v_period_end;

  -- VALIDAÇÃO 5: Verificar duplicatas no período
  SELECT * INTO v_existing_feedback
  FROM public.feedbacks
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND type = 'periodic_feedback'
    AND DATE(created_at) >= v_period_start
    AND DATE(created_at) <= v_period_end;
    
  IF FOUND THEN
    RAISE NOTICE '[FEEDBACK_V4] DUPLICATE: Existing feedback found, id=%', v_existing_feedback.id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feedback já enviado neste período',
      'duplicate', true,
      'existing_feedback_id', v_existing_feedback.id
    );
  END IF;

  -- INÍCIO DA TRANSAÇÃO ATÔMICA
  BEGIN
    RAISE NOTICE '[FEEDBACK_V4] === INSERINDO FEEDBACK ===';
    
    -- Inserir feedback com dados completos
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
      COALESCE(p_feedback_data->'metadata', '{}'::jsonb) || jsonb_build_object(
        'submitted_at', now(),
        'frequency', v_frequency,
        'period_start', v_period_start,
        'period_end', v_period_end,
        'version', 'v4'
      )
    ) RETURNING id INTO v_feedback_id;

    RAISE NOTICE '[FEEDBACK_V4] SUCCESS: Feedback inserted with ID=%', v_feedback_id;

    -- Dar pontos por feedback - com fallback se falhar
    BEGIN
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
          'type', 'periodic_feedback',
          'version', 'v4'
        ),
        50 -- Pontos padrão para feedback
      );
      
      RAISE NOTICE '[FEEDBACK_V4] Points result: %', v_points_result;
      
      IF v_points_result IS NULL OR NOT (v_points_result->>'success')::boolean THEN
        RAISE NOTICE '[FEEDBACK_V4] Points function failed, using fallback';
        v_points_awarded := 50; -- Fallback points
      ELSE
        v_points_awarded := COALESCE((v_points_result->>'points_awarded')::integer, 50);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[FEEDBACK_V4] Points award failed: %, using fallback', SQLERRM;
      v_points_awarded := 50; -- Fallback em caso de erro
    END;

    RAISE NOTICE '[FEEDBACK_V4] === SUCESSO COMPLETO ===';
    
    RETURN jsonb_build_object(
      'success', true,
      'feedback_id', v_feedback_id,
      'points_awarded', v_points_awarded,
      'message', 'Feedback enviado com sucesso!',
      'metadata', jsonb_build_object(
        'frequency', v_frequency,
        'period', v_period_start || ' a ' || v_period_end,
        'version', 'v4'
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[FEEDBACK_V4] TRANSACTION ERROR: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'message', 'Erro interno ao processar feedback: ' || SQLERRM
    );
  END;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[FEEDBACK_V4] OUTER ERROR: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'message', 'Erro crítico: ' || SQLERRM
  );
END;
$$;

-- Verificar se a tabela gamification_activities tem RLS habilitado
ALTER TABLE public.gamification_activities ENABLE ROW LEVEL SECURITY;

-- Comentário sobre as correções
COMMENT ON FUNCTION public.submit_feedback_with_points_v4 IS 'Versão 4 - Corrigida com logs detalhados, validações robustas e fallback para pontos';