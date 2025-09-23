-- FASE 1: CORRIGIR DADOS INCONSISTENTES E CRIAR FUNÇÃO DE SINCRONIZAÇÃO ROBUSTA

-- Criar função para sincronizar student plans com subscriptions
CREATE OR REPLACE FUNCTION public.sync_student_plan_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_id UUID;
  v_plan_catalog_record RECORD;
  v_existing_subscription RECORD;
BEGIN
  -- Apenas processar quando há mudanças relevantes
  IF TG_OP = 'UPDATE' THEN
    -- Só prosseguir se houve mudança em campos relevantes
    IF OLD.active_plan = NEW.active_plan AND 
       OLD.membership_status = NEW.membership_status AND 
       OLD.membership_expiry = NEW.membership_expiry THEN
      RETURN NEW;
    END IF;
  END IF;

  v_teacher_id := NEW.teacher_id;
  
  -- Log da operação
  RAISE NOTICE 'sync_student_plan_subscription: Processing % for student % with plan % and status %', 
    TG_OP, NEW.user_id, NEW.active_plan, NEW.membership_status;

  -- Cancelar todas as subscriptions ativas/pendentes existentes para este aluno
  UPDATE plan_subscriptions 
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE student_user_id = NEW.user_id 
    AND status IN ('active', 'pending');

  -- Se o plano não for 'free' e status for 'active', criar/ativar subscription
  IF NEW.active_plan IS NOT NULL AND NEW.active_plan != 'free' AND NEW.membership_status = 'active' THEN
    
    -- Buscar informações do plano no catálogo (tentar UUID primeiro, depois nome)
    SELECT * INTO v_plan_catalog_record
    FROM plan_catalog 
    WHERE teacher_id = v_teacher_id 
      AND (
        (NEW.active_plan ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' AND id = NEW.active_plan::UUID)
        OR name = NEW.active_plan
      )
    LIMIT 1;

    IF v_plan_catalog_record.id IS NOT NULL THEN
      -- Criar nova subscription ativa
      INSERT INTO plan_subscriptions (
        student_user_id,
        plan_id,
        teacher_id,
        status,
        start_at,
        end_at,
        created_at,
        updated_at
      ) VALUES (
        NEW.user_id,
        v_plan_catalog_record.id,
        v_teacher_id,
        'active',
        COALESCE(NEW.membership_expiry - INTERVAL '1 month', NOW()), -- Estimar data de início
        NEW.membership_expiry,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'sync_student_plan_subscription: Created active subscription for plan % (%)', 
        v_plan_catalog_record.name, v_plan_catalog_record.id;
    ELSE
      RAISE NOTICE 'sync_student_plan_subscription: Plan catalog not found for plan %', NEW.active_plan;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS sync_student_plan_subscription_trigger ON students;

-- Criar novo trigger
CREATE TRIGGER sync_student_plan_subscription_trigger
    AFTER INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_plan_subscription();

-- Limpar dados inconsistentes existentes (executar uma vez)
-- 1. Identificar e corrigir students com subscription pendente mas membership_status = 'active'
WITH inconsistent_students AS (
  SELECT DISTINCT s.user_id, s.teacher_id, s.active_plan, s.membership_status, s.membership_expiry
  FROM students s
  JOIN plan_subscriptions ps ON ps.student_user_id = s.user_id
  WHERE s.membership_status = 'active' 
    AND ps.status = 'pending'
    AND s.membership_expiry > NOW()
)
UPDATE students 
SET updated_at = NOW() -- Força trigger para sincronizar
WHERE user_id IN (SELECT user_id FROM inconsistent_students);

-- 2. Cancelar subscriptions órfãs (sem students correspondentes)
UPDATE plan_subscriptions 
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE student_user_id NOT IN (SELECT user_id FROM students)
  AND status IN ('active', 'pending');

-- 3. Função para professores forçarem sincronização de um aluno específico
CREATE OR REPLACE FUNCTION public.teacher_sync_student_plan(p_student_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  uid UUID := auth.uid();
  student_record RECORD;
BEGIN
  -- Verificar se é professor do aluno
  SELECT * INTO student_record
  FROM students 
  WHERE user_id = p_student_user_id AND teacher_id = uid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized to sync this student or student not found';
  END IF;
  
  -- Forçar sincronização atualizando o registro
  UPDATE students 
  SET updated_at = NOW()
  WHERE user_id = p_student_user_id;
  
  RETURN 'Student plan synchronized successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;