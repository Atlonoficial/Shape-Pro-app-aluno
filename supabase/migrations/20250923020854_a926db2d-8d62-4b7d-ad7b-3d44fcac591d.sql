-- SOLUÇÃO DEFINITIVA: Remover triggers problemáticos e simplificar

-- 1. Remover triggers que causam loop infinito
DROP TRIGGER IF EXISTS trigger_sync_student_plan_subscription ON students;
DROP TRIGGER IF EXISTS trigger_sync_membership ON plan_subscriptions;

-- 2. Manter apenas triggers essenciais sem loop
DROP FUNCTION IF EXISTS sync_student_plan_subscription();
DROP FUNCTION IF EXISTS sync_student_membership(uuid, uuid);

-- 3. Criar função simples para professores atualizarem planos
CREATE OR REPLACE FUNCTION public.teacher_update_student_plan(
  p_student_user_id UUID,
  p_plan_id UUID,
  p_membership_status TEXT DEFAULT 'active',
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID := auth.uid();
  v_plan_data RECORD;
BEGIN
  -- Verificar autorização
  IF NOT EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = p_student_user_id AND teacher_id = v_teacher_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this student';
  END IF;

  -- Verificar plano
  SELECT * INTO v_plan_data FROM plan_catalog 
  WHERE id = p_plan_id AND teacher_id = v_teacher_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or not owned by teacher';
  END IF;

  -- Atualizar student sem triggerar outros triggers
  UPDATE students 
  SET 
    active_plan = p_plan_id::text,
    membership_status = p_membership_status,
    membership_expiry = COALESCE(p_end_date, NOW() + INTERVAL '1 month'),
    updated_at = NOW()
  WHERE user_id = p_student_user_id AND teacher_id = v_teacher_id;

  -- Sincronizar manualmente na plan_subscriptions
  INSERT INTO plan_subscriptions (
    student_user_id, teacher_id, plan_id, status, start_at, end_at
  ) VALUES (
    p_student_user_id, v_teacher_id, p_plan_id, p_membership_status,
    NOW(), COALESCE(p_end_date, NOW() + INTERVAL '1 month')
  )
  ON CONFLICT (student_user_id, plan_id) 
  DO UPDATE SET
    status = p_membership_status,
    start_at = NOW(),
    end_at = COALESCE(p_end_date, NOW() + INTERVAL '1 month'),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Student plan updated successfully',
    'student_id', p_student_user_id,
    'plan_id', p_plan_id,
    'plan_name', v_plan_data.name
  );
END;
$$;