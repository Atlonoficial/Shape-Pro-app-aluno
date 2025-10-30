-- FASE 1: Permitir estudantes visualizarem perfil do seu professor
CREATE POLICY "Students can view their teacher profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_type = 'teacher' 
  AND id IN (
    SELECT teacher_id 
    FROM students 
    WHERE user_id = auth.uid()
  )
);

-- FASE 4: Permitir visualização pública de professores com flag ativa
CREATE POLICY "Public can view teacher profiles with flag"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_type = 'teacher' 
  AND show_profile_to_students = true
);

-- FASE 5: Criar tabela de analytics de visualizações de perfil
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela de analytics
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Política para usuários inserirem suas próprias visualizações
CREATE POLICY "Users can insert own profile views"
ON public.profile_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Política para professores verem quem visualizou seu perfil
CREATE POLICY "Teachers can view their profile views"
ON public.profile_views
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'teacher'
  )
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);