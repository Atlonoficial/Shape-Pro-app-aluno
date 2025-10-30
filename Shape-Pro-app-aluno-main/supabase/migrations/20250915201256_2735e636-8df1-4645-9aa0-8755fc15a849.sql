-- FASE 1: CORREÇÕES DE SEGURANÇA - PARTE 3 (FINAL)
-- Corrigir todas as funções restantes sem search_path definido

-- Listar e corrigir funções que ainda precisam do search_path
CREATE OR REPLACE FUNCTION public.increment_unread_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Incrementar contador baseado no tipo do sender
  IF NEW.sender_type = 'student' THEN
    -- Aluno enviou mensagem - incrementar contador do professor
    UPDATE conversations 
    SET 
      unread_count_teacher = COALESCE(unread_count_teacher, 0) + 1,
      last_message = NEW.message,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSIF NEW.sender_type = 'teacher' THEN
    -- Professor enviou mensagem - incrementar contador do aluno
    UPDATE conversations 
    SET 
      unread_count_student = COALESCE(unread_count_student, 0) + 1,
      last_message = NEW.message,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Corrigir função update_session_activity
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE user_sessions 
  SET last_activity = now()
  WHERE session_token = p_session_token AND is_active = true;
END;
$function$;

-- Corrigir função log_security_activity
CREATE OR REPLACE FUNCTION public.log_security_activity(p_user_id uuid, p_activity_type text, p_activity_description text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_device_info jsonb DEFAULT '{}'::jsonb, p_success boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO security_activity_log (
    user_id,
    activity_type,
    activity_description,
    ip_address,
    user_agent,
    device_info,
    success
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_description,
    p_ip_address,
    p_user_agent,
    p_device_info,
    p_success
  );
END;
$function$;

-- Corrigir função log_sensitive_access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(table_name text, record_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log sensitive data access attempts
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
  -- Fail silently to not break main functionality
  NULL;
END;
$function$;

-- Criar tabela de auditoria se não existir
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  table_name text NOT NULL,
  record_id uuid,
  access_type text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can access audit logs" 
ON public.audit_log 
FOR ALL 
USING (auth.role() = 'service_role');

-- Tabela de sessões de usuário se não existir
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Tabela de log de atividades de segurança se não existir
CREATE TABLE IF NOT EXISTS public.security_activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  activity_type text NOT NULL,
  activity_description text NOT NULL,
  ip_address text,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  success boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security logs" 
ON public.security_activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage security logs" 
ON public.security_activity_log 
FOR ALL 
USING (auth.role() = 'service_role');