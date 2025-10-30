-- CRITICAL SECURITY FIX: Phase 3 - Database Function Security Fixes (Final)
-- Fix the search_path security warnings by updating database functions with correct parameter names

-- 1. Update is_teacher_of function (keep existing parameter names)
CREATE OR REPLACE FUNCTION public.is_teacher_of(_teacher_id uuid, _student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE user_id = _student_user_id AND teacher_id = _teacher_id
  );
$$;

-- 2. Fix is_teacher function 
CREATE OR REPLACE FUNCTION public.is_teacher(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND user_type = 'teacher'
  );
$$;

-- 3. Fix calculate_user_level function
CREATE OR REPLACE FUNCTION public.calculate_user_level(points integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN FLOOR(SQRT(points / 100.0)) + 1;
END;
$$;

-- 4. Fix get_current_plan_week function
CREATE OR REPLACE FUNCTION public.get_current_plan_week(plan_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weeks_passed INTEGER;
  rotation_weeks INTEGER;
  start_date DATE;
BEGIN
  SELECT 
    np.rotation_weeks,
    np.week_start_date
  INTO rotation_weeks, start_date
  FROM nutrition_plans np
  WHERE np.id = plan_id;
  
  IF start_date IS NULL THEN
    RETURN 1;
  END IF;
  
  weeks_passed := FLOOR(EXTRACT(days FROM (CURRENT_DATE - start_date)) / 7);
  RETURN (weeks_passed % rotation_weeks) + 1;
END;
$$;

-- 5. Fix validate_input function
CREATE OR REPLACE FUNCTION public.validate_input(input_text text, max_length integer DEFAULT 1000, allow_html boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 6. Fix get_teacher_name function
CREATE OR REPLACE FUNCTION public.get_teacher_name(teacher_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  teacher_name text;
BEGIN
  SELECT COALESCE(p.name, p.email) INTO teacher_name
  FROM public.profiles p
  WHERE p.id = teacher_id_param;
  
  RETURN COALESCE(teacher_name, 'Professor');
END;
$$;