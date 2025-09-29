-- Criar função para ativar plano do estudante
CREATE OR REPLACE FUNCTION public.activate_student_plan(
  p_student_id UUID,
  p_teacher_id UUID,
  p_plan_catalog_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_data RECORD;
  v_subscription_id UUID;
  v_end_date DATE;
BEGIN
  -- Buscar dados do plano
  SELECT * INTO v_plan_data
  FROM plan_catalog 
  WHERE id = p_plan_catalog_id AND teacher_id = p_teacher_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plano não encontrado';
  END IF;
  
  -- Calcular data de fim baseada no intervalo do plano
  CASE v_plan_data.interval_type
    WHEN 'monthly' THEN
      v_end_date := CURRENT_DATE + (v_plan_data.interval_count || ' months')::INTERVAL;
    WHEN 'yearly' THEN  
      v_end_date := CURRENT_DATE + (v_plan_data.interval_count || ' years')::INTERVAL;
    WHEN 'weekly' THEN
      v_end_date := CURRENT_DATE + (v_plan_data.interval_count || ' weeks')::INTERVAL;
    ELSE
      v_end_date := CURRENT_DATE + INTERVAL '1 month'; -- Default
  END CASE;
  
  -- Desativar assinaturas ativas existentes
  UPDATE active_subscriptions 
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = p_student_id AND teacher_id = p_teacher_id AND status = 'active';
  
  -- Criar nova assinatura ativa
  INSERT INTO active_subscriptions (
    user_id,
    teacher_id, 
    plan_id,
    start_date,
    end_date,
    status,
    features,
    auto_renew
  ) VALUES (
    p_student_id,
    p_teacher_id,
    p_plan_catalog_id,
    CURRENT_DATE,
    v_end_date,
    'active',
    v_plan_data.features,
    true
  ) RETURNING id INTO v_subscription_id;
  
  -- Atualizar dados do estudante
  UPDATE students 
  SET 
    membership_status = 'active',
    membership_end_date = v_end_date,
    updated_at = NOW()
  WHERE user_id = p_student_id AND teacher_id = p_teacher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'plan_name', v_plan_data.name,
    'end_date', v_end_date
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;