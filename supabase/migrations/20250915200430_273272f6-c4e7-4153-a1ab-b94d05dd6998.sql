-- FASE 1: CORREÇÕES DE SEGURANÇA
-- Corrigir funções sem search_path definido

-- 1. Corrigir função validate_release_days
CREATE OR REPLACE FUNCTION public.validate_release_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If release_mode is 'days_after_enrollment', release_after_days must be set
  IF NEW.release_mode = 'days_after_enrollment' AND NEW.release_after_days IS NULL THEN
    RAISE EXCEPTION 'release_after_days deve ser especificado quando release_mode é days_after_enrollment';
  END IF;
  
  -- If release_mode is 'immediate', release_after_days should be null
  IF NEW.release_mode = 'immediate' THEN
    NEW.release_after_days := NULL;
  END IF;
  
  -- Validate release_after_days is positive
  IF NEW.release_after_days IS NOT NULL AND NEW.release_after_days < 0 THEN
    RAISE EXCEPTION 'release_after_days deve ser um número positivo';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Corrigir função auto_reset_teacher_unread_count
CREATE OR REPLACE FUNCTION public.auto_reset_teacher_unread_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Quando uma mensagem é marcada como lida e o sender não é o professor
  IF NEW.is_read = true AND OLD.is_read = false AND NEW.sender_type = 'student' THEN
    -- Verificar se ainda há mensagens não lidas do aluno nesta conversa
    UPDATE conversations 
    SET unread_count_teacher = (
      SELECT COUNT(*)
      FROM chat_messages 
      WHERE conversation_id = NEW.conversation_id 
        AND sender_type = 'student'
        AND is_read = false
    ),
    updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Corrigir função update_teacher_payment_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_teacher_payment_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Corrigir função trigger_realtime_banner_metrics
CREATE OR REPLACE FUNCTION public.trigger_realtime_banner_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Agregar para o dia da interação
  PERFORM public.aggregate_daily_banner_metrics(DATE(NEW.created_at));
  RETURN NEW;
END;
$function$;

-- 5. Corrigir função auto_award_meal_points_v3
CREATE OR REPLACE FUNCTION public.auto_award_meal_points_v3()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se deve dar pontos (só quando consumed = true)
  IF TG_OP = 'INSERT' AND NEW.consumed = true THEN
    PERFORM award_points_enhanced_v3(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.consumed = true AND (OLD.consumed IS NULL OR OLD.consumed = false) THEN
    PERFORM award_points_enhanced_v3(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada', 
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. Corrigir função auto_award_progress_points_v3
CREATE OR REPLACE FUNCTION public.auto_award_progress_points_v3()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM award_points_enhanced_v3(
    NEW.user_id,
    'progress_logged',
    'Progresso atualizado: ' || NEW.type,
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value, 'unit', NEW.unit)
  );
  RETURN NEW;
END;
$function$;