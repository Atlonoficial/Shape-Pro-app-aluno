-- FASE 1: CORREÇÕES DE SEGURANÇA - PARTE 2
-- Corrigir funções restantes sem search_path definido

-- 7. Corrigir função trigger_auto_aggregate_banner_metrics
CREATE OR REPLACE FUNCTION public.trigger_auto_aggregate_banner_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Chamar função de agregação quando houver nova interação
  PERFORM public.aggregate_banner_metrics_realtime(NEW.banner_id);
  RETURN NEW;
END;
$function$;

-- 8. Corrigir função trigger_check_achievements
CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- 9. Corrigir função update_student_last_activity
CREATE OR REPLACE FUNCTION public.update_student_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar last_activity quando há atividade de gamificação
  IF TG_TABLE_NAME = 'gamification_activities' THEN
    UPDATE students 
    SET last_activity = NEW.created_at 
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- Atualizar last_workout quando há treino completado
  IF TG_TABLE_NAME = 'gamification_activities' AND NEW.activity_type = 'training_completed' THEN
    UPDATE students 
    SET last_workout = NEW.created_at,
        weekly_frequency = COALESCE(weekly_frequency, 0) + 1
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 10. Corrigir função update_notification_logs_updated_at
CREATE OR REPLACE FUNCTION public.update_notification_logs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 11. Corrigir função validate_appointment_time
CREATE OR REPLACE FUNCTION public.validate_appointment_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only validate on INSERT, not UPDATE (to allow status changes on past appointments)
  IF TG_OP = 'INSERT' THEN
    -- Allow scheduling up to 1 hour in the past (for timezone flexibility)
    IF NEW.scheduled_time < (now() - interval '1 hour') THEN
      RAISE EXCEPTION 'Cannot schedule appointments more than 1 hour in the past';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 12. Corrigir função generate_backup_codes
CREATE OR REPLACE FUNCTION public.generate_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  codes text[] := '{}';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    codes := array_append(codes, upper(encode(gen_random_bytes(4), 'hex')));
  END LOOP;
  RETURN codes;
END;
$function$;

-- Criar função para limpeza automática de logs antigos com schedule
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Limpar logs de rate limit antigos (mais de 24 horas)
  DELETE FROM rate_limit_log 
  WHERE created_at < (NOW() - INTERVAL '24 hours');
  
  -- Limpar mensagens de chat antigas (mais de 3 meses)
  DELETE FROM chat_messages 
  WHERE created_at < (NOW() - INTERVAL '3 months');
  
  -- Limpar compromissos antigos cancelados/completados (mais de 6 meses)
  DELETE FROM appointments 
  WHERE scheduled_time < (NOW() - INTERVAL '6 months')
    AND status IN ('cancelled', 'completed');
    
  -- Log da limpeza
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$function$;