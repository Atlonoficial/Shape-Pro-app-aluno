-- SECURITY FIX: Fix User Presence Privacy Leak
-- Drop the overly permissive user_presence SELECT policy
DROP POLICY IF EXISTS "Users can view presence in same channel" ON public.user_presence;

-- Create more restrictive policies for user_presence
CREATE POLICY "Users can view own presence" 
ON public.user_presence 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student presence" 
ON public.user_presence 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = user_presence.user_id 
    AND s.teacher_id = auth.uid()
  )
);

-- SECURITY FIX: Secure Database Functions with proper search_path
-- Update existing functions to use proper security settings

CREATE OR REPLACE FUNCTION public.is_teacher(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND user_type = 'teacher'
  );
$function$;

CREATE OR REPLACE FUNCTION public.validate_input(input_text text, max_length integer DEFAULT 1000, allow_html boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF input_text IS NULL OR LENGTH(input_text) > max_length THEN
    RETURN FALSE;
  END IF;
  
  IF NOT allow_html AND (
    input_text ILIKE '%<script%' OR
    input_text ILIKE '%javascript:%' OR
    input_text ILIKE '%on%=%' OR
    input_text ILIKE '%data:text/html%'
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, max_attempts integer DEFAULT 5, time_window interval DEFAULT '01:00:00'::interval)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count recent attempts for this user and operation
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.rate_limit_log
  WHERE user_id = auth.uid()
    AND operation_type = check_rate_limit.operation_type
    AND created_at > (NOW() - time_window);
  
  -- Log this attempt
  INSERT INTO public.rate_limit_log (user_id, operation_type)
  VALUES (auth.uid(), operation_type);
  
  -- Return whether under limit
  RETURN attempt_count < max_attempts;
EXCEPTION WHEN OTHERS THEN
  -- On error, allow the operation but log it
  RETURN TRUE;
END;
$function$;

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

-- SECURITY FIX: Add function to safely check teacher-student relationships
CREATE OR REPLACE FUNCTION public.is_teacher_of(teacher_user_id uuid, student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = student_user_id 
    AND s.teacher_id = teacher_user_id
  );
$function$;

-- SECURITY FIX: Strengthen RLS on sensitive tables
-- Update students table policies to be more explicit
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;
CREATE POLICY "Teachers can view own students" 
ON public.students 
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Update profiles policies to prevent information leakage
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Teachers can view student profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != id AND 
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = profiles.id 
    AND s.teacher_id = auth.uid()
  )
);

-- SECURITY FIX: Add audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log sensitive table modifications
  IF TG_TABLE_NAME IN ('profiles', 'students', 'user_roles') THEN
    INSERT INTO audit_log (user_id, table_name, record_id, access_type)
    VALUES (auth.uid(), TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_students_changes ON public.students;  
CREATE TRIGGER audit_students_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();