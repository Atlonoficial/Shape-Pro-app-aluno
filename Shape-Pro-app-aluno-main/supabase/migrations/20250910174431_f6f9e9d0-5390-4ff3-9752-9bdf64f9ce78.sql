-- CRITICAL SECURITY FIX: Phase 3 - Database Function Security Fixes (Fixed)
-- Fix the search_path security warnings by updating database functions without dropping dependencies

-- 1. Update is_teacher_of function (just replace, don't drop)
CREATE OR REPLACE FUNCTION public.is_teacher_of(teacher_id uuid, student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE user_id = student_user_id AND teacher_id = is_teacher_of.teacher_id
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
  -- Sistema de níveis: Nível = sqrt(pontos / 100) + 1
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
  
  -- Calcular semana atual considerando rotação
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
  -- Basic validation
  IF input_text IS NULL OR LENGTH(input_text) > max_length THEN
    RETURN FALSE;
  END IF;
  
  -- Check for potential XSS if HTML not allowed
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

-- 6. Fix additional functions with search_path issues
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

-- 7. Fix award_points function
CREATE OR REPLACE FUNCTION public.award_points(p_user_id uuid, p_points integer, p_activity_type text, p_description text DEFAULT ''::text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_points integer := 0;
  new_level integer;
  old_level integer := 1;
BEGIN
  -- Buscar nível atual
  SELECT level INTO old_level FROM public.user_points WHERE user_id = p_user_id;
  IF old_level IS NULL THEN old_level := 1; END IF;

  -- Inserir atividade
  INSERT INTO public.gamification_activities (
    user_id, activity_type, points_earned, description, metadata
  ) VALUES (
    p_user_id, p_activity_type, p_points, p_description, p_metadata
  );

  -- Upsert pontos do usuário
  INSERT INTO public.user_points (user_id, total_points, level, last_activity_date)
  VALUES (p_user_id, p_points, public.calculate_user_level(p_points), CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + p_points,
    level = public.calculate_user_level(user_points.total_points + p_points),
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  RETURNING level INTO new_level;

  -- Verificar se subiu de nível
  IF new_level > old_level THEN
    -- Dar pontos bonus por subir de nível
    UPDATE public.user_points 
    SET total_points = total_points + (new_level * 10)
    WHERE user_id = p_user_id;
    
    -- Registrar atividade de nível
    INSERT INTO public.gamification_activities (
      user_id, activity_type, points_earned, description, metadata
    ) VALUES (
      p_user_id, 'level_up', new_level * 10, 
      'Subiu para o nível ' || new_level, 
      jsonb_build_object('level', new_level)
    );
  END IF;
END;
$$;