-- CRITICAL SECURITY FIX: Phase 2 - Remaining Critical Tables + Database Function Security
-- This completes the data protection and fixes function security issues

-- 5. MEDICAL_EXAMS table - Enable RLS and add policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_exams' AND table_schema = 'public') THEN
        -- Table doesn't exist, skip
        RAISE NOTICE 'medical_exams table does not exist, skipping...';
    ELSE
        ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own medical exams" ON public.medical_exams;
        DROP POLICY IF EXISTS "Users can insert own medical exams" ON public.medical_exams;
        DROP POLICY IF EXISTS "Users can update own medical exams" ON public.medical_exams;
        DROP POLICY IF EXISTS "Teachers can view student medical exams" ON public.medical_exams;

        CREATE POLICY "Users can view own medical exams" 
        ON public.medical_exams 
        FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own medical exams" 
        ON public.medical_exams 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own medical exams" 
        ON public.medical_exams 
        FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Teachers can view student medical exams" 
        ON public.medical_exams 
        FOR SELECT 
        USING (is_teacher_of(auth.uid(), user_id));
    END IF;
END $$;

-- 6. MEAL_LOGS table - Enable RLS and add policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meal_logs' AND table_schema = 'public') THEN
        RAISE NOTICE 'meal_logs table does not exist, skipping...';
    ELSE
        ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can manage own meal logs" ON public.meal_logs;
        DROP POLICY IF EXISTS "Teachers can view student meal logs" ON public.meal_logs;

        CREATE POLICY "Users can manage own meal logs" 
        ON public.meal_logs 
        FOR ALL 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Teachers can view student meal logs" 
        ON public.meal_logs 
        FOR SELECT 
        USING (is_teacher_of(auth.uid(), user_id));
    END IF;
END $$;

-- 7. MEAL_ROTATIONS table - Enable RLS and add policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meal_rotations' AND table_schema = 'public') THEN
        RAISE NOTICE 'meal_rotations table does not exist, skipping...';
    ELSE
        ALTER TABLE public.meal_rotations ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view meal rotations from assigned nutrition plans" ON public.meal_rotations;
        DROP POLICY IF EXISTS "Teachers can manage meal rotations" ON public.meal_rotations;

        CREATE POLICY "Users can view meal rotations from assigned nutrition plans" 
        ON public.meal_rotations 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.nutrition_plans np 
            WHERE np.id = meal_rotations.nutrition_plan_id 
            AND (auth.uid() = ANY(np.assigned_to) OR auth.uid() = np.created_by)
          )
        );

        CREATE POLICY "Teachers can manage meal rotations" 
        ON public.meal_rotations 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.nutrition_plans np 
            WHERE np.id = meal_rotations.nutrition_plan_id 
            AND auth.uid() = np.created_by
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.nutrition_plans np 
            WHERE np.id = meal_rotations.nutrition_plan_id 
            AND auth.uid() = np.created_by
          )
        );
    END IF;
END $$;

-- DATABASE FUNCTION SECURITY FIXES - Fix search_path issues
-- Update key functions with proper security settings

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