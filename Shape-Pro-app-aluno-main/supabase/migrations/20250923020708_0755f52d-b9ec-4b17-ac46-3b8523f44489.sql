-- FASE 1: CORRIGIR ESTRUTURA DE DADOS E SINCRONIZAÇÃO

-- 1. Primeiro, vamos corrigir a função de sincronização para lidar com tipos inconsistentes
CREATE OR REPLACE FUNCTION public.sync_student_plan_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_uuid UUID;
  v_plan_data RECORD;
BEGIN
  RAISE NOTICE 'sync_student_plan_subscription triggered for user: %, active_plan: %', NEW.user_id, NEW.active_plan;

  -- Se active_plan for removido/limpo
  IF NEW.active_plan IS NULL OR NEW.active_plan = '' OR NEW.active_plan = 'free' THEN
    -- Inativar todas as assinaturas do usuário
    UPDATE plan_subscriptions 
    SET status = 'inactive', updated_at = NOW()
    WHERE student_user_id = NEW.user_id AND status = 'active';
    RAISE NOTICE 'Inactivated subscriptions for user: %', NEW.user_id;
    RETURN NEW;
  END IF;

  -- Tentar converter active_plan para UUID se necessário
  BEGIN
    -- Se já é UUID, usar diretamente
    v_plan_uuid := NEW.active_plan::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Se não é UUID, buscar por nome na tabela plan_catalog
    SELECT id INTO v_plan_uuid
    FROM plan_catalog
    WHERE name = NEW.active_plan AND teacher_id = NEW.teacher_id
    LIMIT 1;
    
    -- Se não encontrou por nome, criar um plano básico
    IF v_plan_uuid IS NULL THEN
      RAISE NOTICE 'Creating basic plan for name: % and teacher: %', NEW.active_plan, NEW.teacher_id;
      INSERT INTO plan_catalog (
        id, teacher_id, name, price, currency, interval, features, is_active
      ) VALUES (
        gen_random_uuid(), NEW.teacher_id, NEW.active_plan, 0, 'BRL', 'monthly', '[]'::jsonb, true
      ) RETURNING id INTO v_plan_uuid;
    END IF;
  END;

  -- Verificar se o plano existe
  SELECT * INTO v_plan_data FROM plan_catalog WHERE id = v_plan_uuid;
  IF NOT FOUND THEN
    RAISE NOTICE 'Plan not found: %, skipping sync', v_plan_uuid;
    RETURN NEW;
  END IF;

  -- Inativar assinaturas antigas
  UPDATE plan_subscriptions 
  SET status = 'inactive', updated_at = NOW()
  WHERE student_user_id = NEW.user_id AND status = 'active';

  -- Criar/ativar nova assinatura
  INSERT INTO plan_subscriptions (
    student_user_id, teacher_id, plan_id, status, start_at, end_at
  ) VALUES (
    NEW.user_id, 
    NEW.teacher_id, 
    v_plan_uuid, 
    CASE 
      WHEN NEW.membership_status = 'active' THEN 'active'
      ELSE 'pending'
    END,
    COALESCE(NEW.created_at, NOW()),
    NEW.membership_expiry
  )
  ON CONFLICT (student_user_id, plan_id) 
  DO UPDATE SET
    status = CASE 
      WHEN NEW.membership_status = 'active' THEN 'active'
      ELSE 'pending'
    END,
    start_at = COALESCE(NEW.created_at, NOW()),
    end_at = NEW.membership_expiry,
    updated_at = NOW();

  RAISE NOTICE 'Synced subscription for user: %, plan: %, status: %', NEW.user_id, v_plan_uuid, NEW.membership_status;
  RETURN NEW;
END;
$$;

-- 2. Atualizar dados existentes para garantir consistência
UPDATE students 
SET active_plan = pc.id::text
FROM plan_catalog pc
WHERE students.active_plan = pc.name 
  AND students.teacher_id = pc.teacher_id
  AND students.active_plan ~ '^[a-zA-Z]'; -- Apenas nomes (não UUIDs)

-- 3. Criar função para professores atualizarem planos de alunos
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
  result JSONB;
BEGIN
  -- Verificar se é professor do aluno
  IF NOT EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = p_student_user_id AND teacher_id = v_teacher_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this student';
  END IF;

  -- Verificar se o plano pertence ao professor
  SELECT * INTO v_plan_data FROM plan_catalog 
  WHERE id = p_plan_id AND teacher_id = v_teacher_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or not owned by teacher';
  END IF;

  -- Atualizar student (isso vai triggerar a sincronização)
  UPDATE students 
  SET 
    active_plan = p_plan_id::text,
    membership_status = p_membership_status,
    membership_expiry = COALESCE(p_end_date, NOW() + INTERVAL '1 month'),
    updated_at = NOW()
  WHERE user_id = p_student_user_id AND teacher_id = v_teacher_id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Student plan updated successfully',
    'student_id', p_student_user_id,
    'plan_id', p_plan_id,
    'plan_name', v_plan_data.name
  );

  RETURN result;
END;
$$;