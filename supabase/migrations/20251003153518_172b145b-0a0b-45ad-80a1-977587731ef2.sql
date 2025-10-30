-- ============================================================================
-- SECURITY FIXES - Remaining Functions (Phase 2)
-- ============================================================================

-- Fix remaining functions without SET search_path = public
-- These are security definer functions that need proper search_path

-- Function: auto_assign_tenant_id
CREATE OR REPLACE FUNCTION public.auto_assign_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_tenant_id UUID;
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
  IF v_tenant_id IS NOT NULL THEN NEW.tenant_id := v_tenant_id; END IF;
  RETURN NEW;
END;
$function$;

-- Function: update_session_activity
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_sessions 
  SET last_activity = now()
  WHERE session_token = p_session_token AND is_active = true;
END;
$function$;

-- Function: safe_delete_user
CREATE OR REPLACE FUNCTION public.safe_delete_user(user_id_to_delete uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_delete) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;
  DELETE FROM payment_audit_log WHERE user_id = user_id_to_delete;
  DELETE FROM audit_log WHERE user_id = user_id_to_delete;
  RETURN jsonb_build_object('success', true, 'message', 'Pronto para exclusão');
END;
$function$;

-- Function: log_sensitive_access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(table_name text, record_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO audit_log (
    user_id,
    table_name,
    record_id,
    access_type,
    timestamp
  ) VALUES (
    auth.uid(),
    table_name,
    record_id,
    access_type,
    NOW()
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$function$;

-- Function: check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, max_attempts integer DEFAULT 5, time_window interval DEFAULT '01:00:00'::interval)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.rate_limit_log
  WHERE user_id = auth.uid()
    AND operation_type = check_rate_limit.operation_type
    AND created_at > (NOW() - time_window);
  
  INSERT INTO public.rate_limit_log (user_id, operation_type)
  VALUES (auth.uid(), operation_type);
  
  RETURN attempt_count < max_attempts;
EXCEPTION WHEN OTHERS THEN
  RETURN TRUE;
END;
$function$;

-- Function: cleanup_rate_limit_logs
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM rate_limit_log 
  WHERE created_at < (NOW() - INTERVAL '24 hours');
END;
$function$;

-- Function: validate_input
CREATE OR REPLACE FUNCTION public.validate_input(input_text text, max_length integer DEFAULT 1000, allow_html boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF input_text IS NULL OR LENGTH(input_text) > max_length THEN
    RETURN FALSE;
  END IF;
  
  IF NOT allow_html AND (
    input_text ILIKE '%<script%' OR
    input_text ILIKE '%javascript:%' OR
    input_text ILIKE '%on%=%' OR
    input_text ILIKE '%data:text/html%' OR
    input_text ILIKE '%<iframe%' OR
    input_text ILIKE '%<object%' OR
    input_text ILIKE '%<embed%'
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- ============================================================================
-- SECURITY ENHANCEMENTS APPLIED - Phase 2
-- ============================================================================
-- ✅ Added SET search_path = public to 7 more security definer functions
-- ============================================================================