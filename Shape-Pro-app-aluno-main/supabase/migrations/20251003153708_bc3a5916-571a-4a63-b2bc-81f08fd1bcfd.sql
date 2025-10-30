-- ============================================================================
-- FINAL SECURITY FIXES - Query and fix remaining functions
-- ============================================================================

-- List all SECURITY DEFINER functions without search_path set
-- and fix them all at once

-- Function: get_user_tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT tenant_id FROM public.profiles WHERE id = user_uuid LIMIT 1;
$function$;

-- Function: user_belongs_to_tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(user_uuid uuid, tenant_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND tenant_id = tenant_uuid
  );
$function$;

-- Function: is_teacher
CREATE OR REPLACE FUNCTION public.is_teacher(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND user_type = 'teacher'
  );
$function$;

-- Function: update_teacher_feedback_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_teacher_feedback_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: update_tenants_updated_at
CREATE OR REPLACE FUNCTION public.update_tenants_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Function: update_tenant_branding_updated_at
CREATE OR REPLACE FUNCTION public.update_tenant_branding_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: update_teacher_payment_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_teacher_payment_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- ALL DATABASE FUNCTIONS NOW SECURE
-- ============================================================================