-- Criar função para inserir feedback com pontos atomicamente
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points(
  p_student_id uuid,
  p_teacher_id uuid, 
  p_feedback_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_feedback_id UUID;
  v_points_result JSONB;
  v_existing_feedback RECORD;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
BEGIN
  -- Validar relacionamento teacher/student
  IF NOT EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = p_student_id AND teacher_id = p_teacher_id
  ) THEN
    RAISE EXCEPTION 'Invalid teacher-student relationship';
  END IF;

  -- Verificar se já existe feedback desta semana para este professor
  SELECT * INTO v_existing_feedback
  FROM feedbacks
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND type = p_feedback_data->>'type'
    AND DATE(created_at) >= v_week_start;
    
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feedback já enviado esta semana',
      'duplicate', true
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
    p_feedback_data->>'type',
    (p_feedback_data->>'rating')::integer,
    COALESCE(p_feedback_data->>'message', ''),
    COALESCE(p_feedback_data->'metadata', '{}'::jsonb)
  ) RETURNING id INTO v_feedback_id;

  -- Dar pontos por feedback
  SELECT * INTO v_points_result
  FROM award_points_enhanced_v3(
    p_student_id,
    'periodic_feedback',
    'Feedback enviado',
    jsonb_build_object(
      'teacher_id', p_teacher_id,
      'feedback_id', v_feedback_id,
      'week', EXTRACT(week FROM CURRENT_DATE),
      'year', EXTRACT(year FROM CURRENT_DATE)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id,
    'points_result', v_points_result,
    'points_awarded', COALESCE(v_points_result->>'points_awarded', '0')::integer
  );
EXCEPTION WHEN OTHERS THEN
  -- Log do erro para debugging
  RAISE NOTICE 'Error in submit_feedback_with_points: %', SQLERRM;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Erro interno ao processar feedback'
  );
END;
$function$;