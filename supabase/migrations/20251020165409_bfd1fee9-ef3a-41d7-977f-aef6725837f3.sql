-- ============================================
-- ETAPA 3: Correção de Permissões RPC e RLS
-- ============================================

-- 1. Verificar e corrigir função RPC submit_feedback_with_points_v4
-- Se a função existir, garantir que tem SECURITY DEFINER
DO $$
BEGIN
  -- Alterar função para SECURITY DEFINER se existir
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_feedback_with_points_v4') THEN
    EXECUTE 'ALTER FUNCTION submit_feedback_with_points_v4(uuid, uuid, jsonb) SECURITY DEFINER';
    RAISE NOTICE 'Function submit_feedback_with_points_v4 set to SECURITY DEFINER';
  ELSE
    RAISE NOTICE 'Function submit_feedback_with_points_v4 does not exist yet';
  END IF;
END $$;

-- 2. Garantir permissões EXECUTE para authenticated users
GRANT EXECUTE ON FUNCTION submit_feedback_with_points_v4(uuid, uuid, jsonb) TO authenticated;

-- 3. Criar helper function para RLS (usando membership_status ao invés de status)
CREATE OR REPLACE FUNCTION public.get_student_teacher_id(student_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id 
  FROM public.students 
  WHERE user_id = student_uid 
    AND membership_status IN ('active', 'free_trial')
  LIMIT 1;
$$;

-- 4. Verificar e criar policies RLS na tabela feedbacks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedbacks') THEN
    -- Habilitar RLS se não estiver habilitado
    ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on feedbacks table';

    -- Drop existing INSERT policy se existir
    DROP POLICY IF EXISTS "Students can insert own feedbacks" ON public.feedbacks;
    DROP POLICY IF EXISTS "students_can_insert_feedback" ON public.feedbacks;
    DROP POLICY IF EXISTS "Users can insert feedbacks" ON public.feedbacks;
    DROP POLICY IF EXISTS "students_can_insert_own_feedback" ON public.feedbacks;

    -- Criar policy para INSERT (students podem inserir seus próprios feedbacks)
    CREATE POLICY "students_can_insert_own_feedback" ON public.feedbacks
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = student_id);

    RAISE NOTICE 'INSERT policy created for feedbacks';

    -- Drop existing SELECT policy se existir  
    DROP POLICY IF EXISTS "Students can view own feedbacks" ON public.feedbacks;
    DROP POLICY IF EXISTS "students_can_view_feedback" ON public.feedbacks;
    DROP POLICY IF EXISTS "Users can select feedbacks" ON public.feedbacks;
    DROP POLICY IF EXISTS "students_can_view_own_feedback" ON public.feedbacks;

    -- Criar policy para SELECT (students podem ver seus próprios feedbacks)
    CREATE POLICY "students_can_view_own_feedback" ON public.feedbacks
      FOR SELECT
      TO authenticated
      USING (auth.uid() = student_id);

    RAISE NOTICE 'SELECT policy created for feedbacks';

    -- Drop existing policy para teachers se existir
    DROP POLICY IF EXISTS "Teachers can view student feedbacks" ON public.feedbacks;
    DROP POLICY IF EXISTS "teachers_can_view_feedback" ON public.feedbacks;
    DROP POLICY IF EXISTS "teachers_can_view_student_feedback" ON public.feedbacks;

    -- Criar policy para teachers verem feedbacks dos seus alunos
    CREATE POLICY "teachers_can_view_student_feedback" ON public.feedbacks
      FOR SELECT
      TO authenticated
      USING (
        teacher_id = auth.uid()
      );

    RAISE NOTICE 'Teacher SELECT policy created for feedbacks';

    -- Drop existing UPDATE policy para teachers se existir
    DROP POLICY IF EXISTS "Teachers can update student feedbacks" ON public.feedbacks;
    DROP POLICY IF EXISTS "teachers_can_update_feedback" ON public.feedbacks;
    DROP POLICY IF EXISTS "teachers_can_update_student_feedback" ON public.feedbacks;

    -- Criar policy para teachers atualizarem feedbacks (adicionar resposta)
    CREATE POLICY "teachers_can_update_student_feedback" ON public.feedbacks
      FOR UPDATE
      TO authenticated
      USING (teacher_id = auth.uid())
      WITH CHECK (teacher_id = auth.uid());

    RAISE NOTICE 'Teacher UPDATE policy created for feedbacks';

  ELSE
    RAISE NOTICE 'Feedbacks table does not exist';
  END IF;
END $$;

-- 5. Verificar e criar policies RLS na tabela teacher_feedback_settings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_feedback_settings') THEN
    -- Habilitar RLS
    ALTER TABLE public.teacher_feedback_settings ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies se existirem
    DROP POLICY IF EXISTS "Teachers can manage own settings" ON public.teacher_feedback_settings;
    DROP POLICY IF EXISTS "Students can view teacher settings" ON public.teacher_feedback_settings;
    DROP POLICY IF EXISTS "teachers_manage_settings" ON public.teacher_feedback_settings;
    DROP POLICY IF EXISTS "students_view_settings" ON public.teacher_feedback_settings;
    DROP POLICY IF EXISTS "teachers_manage_own_settings" ON public.teacher_feedback_settings;
    DROP POLICY IF EXISTS "students_view_teacher_settings" ON public.teacher_feedback_settings;

    -- Teachers podem gerenciar suas próprias configurações
    CREATE POLICY "teachers_manage_own_settings" ON public.teacher_feedback_settings
      FOR ALL
      TO authenticated
      USING (teacher_id = auth.uid())
      WITH CHECK (teacher_id = auth.uid());

    -- Students podem ver as configurações do seu professor (usando security definer function)
    CREATE POLICY "students_view_teacher_settings" ON public.teacher_feedback_settings
      FOR SELECT
      TO authenticated
      USING (teacher_id = public.get_student_teacher_id(auth.uid()));

    RAISE NOTICE 'Policies created for teacher_feedback_settings';
  ELSE
    RAISE NOTICE 'teacher_feedback_settings table does not exist';
  END IF;
END $$;