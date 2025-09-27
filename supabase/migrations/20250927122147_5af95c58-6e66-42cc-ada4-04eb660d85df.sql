-- Adicionar índices para melhorar performance do sistema de pagamentos e planos
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_student_teacher 
ON plan_subscriptions(student_user_id, teacher_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_student_status 
ON payment_transactions(student_id, teacher_id, status);

CREATE INDEX IF NOT EXISTS idx_plan_catalog_teacher 
ON plan_catalog(teacher_id, is_active);

-- Trigger para atualização automática de permissões após mudanças em plan_subscriptions
CREATE OR REPLACE FUNCTION public.trigger_permissions_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log mudança para debugging
  RAISE NOTICE 'Plan subscription changed for user %: % -> %', 
    COALESCE(NEW.student_user_id, OLD.student_user_id),
    COALESCE(OLD.status, 'null'),
    COALESCE(NEW.status, 'deleted');
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Aplicar trigger na tabela plan_subscriptions
DROP TRIGGER IF EXISTS trigger_plan_subscription_permissions ON plan_subscriptions;
CREATE TRIGGER trigger_plan_subscription_permissions
  AFTER INSERT OR UPDATE OR DELETE ON plan_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_permissions_refresh();

-- Função para ativar plano automaticamente (para uso pelo webhook)
CREATE OR REPLACE FUNCTION public.activate_student_plan(
  p_student_id uuid,
  p_teacher_id uuid,
  p_plan_catalog_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_plan_data record;
  v_start_date timestamptz := now();
  v_end_date timestamptz;
BEGIN
  -- Buscar dados do plano
  SELECT * INTO v_plan_data
  FROM plan_catalog
  WHERE id = p_plan_catalog_id 
    AND teacher_id = p_teacher_id
    AND is_active = true;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or inactive: %', p_plan_catalog_id;
  END IF;
  
  -- Calcular data de expiração
  CASE v_plan_data.interval
    WHEN 'monthly' THEN
      v_end_date := v_start_date + interval '1 month';
    WHEN 'quarterly' THEN
      v_end_date := v_start_date + interval '3 months';
    WHEN 'yearly' THEN
      v_end_date := v_start_date + interval '1 year';
    ELSE
      v_end_date := v_start_date + interval '1 month';
  END CASE;
  
  -- Atualizar/criar assinatura
  INSERT INTO plan_subscriptions (
    student_user_id,
    teacher_id,
    plan_id,
    status,
    start_at,
    end_at,
    renewed_at
  ) VALUES (
    p_student_id,
    p_teacher_id,
    p_plan_catalog_id,
    'active',
    v_start_date,
    v_end_date,
    v_start_date
  )
  ON CONFLICT (student_user_id, teacher_id, plan_id)
  DO UPDATE SET
    status = 'active',
    start_at = v_start_date,
    end_at = v_end_date,
    renewed_at = v_start_date,
    updated_at = now();
  
  -- Atualizar tabela students
  UPDATE students
  SET 
    active_plan = v_plan_data.name,
    membership_status = 'active'
  WHERE user_id = p_student_id 
    AND teacher_id = p_teacher_id;
  
  -- Dar pontos por ativação do plano
  PERFORM award_points_enhanced_v3(
    p_student_id,
    'plan_activated',
    'Plano ' || v_plan_data.name || ' ativado',
    jsonb_build_object(
      'plan_id', p_plan_catalog_id,
      'plan_name', v_plan_data.name,
      'plan_price', v_plan_data.price
    ),
    100 -- 100 pontos por ativação
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'plan_name', v_plan_data.name,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'message', 'Plan activated successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to activate plan: %', SQLERRM;
END;
$function$;