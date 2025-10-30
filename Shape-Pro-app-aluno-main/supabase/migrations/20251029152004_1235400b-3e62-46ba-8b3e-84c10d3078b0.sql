-- ✅ BUILD 38: Trigger Automático para Criar Registros de Estudantes
-- Garante que todo novo usuário do tipo 'student' tenha um registro na tabela students

-- Criar função para inserir registro na tabela students automaticamente
CREATE OR REPLACE FUNCTION public.auto_create_student_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só cria registro se o user_type for 'student'
  IF NEW.user_type = 'student' THEN
    INSERT INTO public.students (user_id, teacher_id, created_at)
    VALUES (NEW.id, NULL, NOW())
    ON CONFLICT (user_id) DO NOTHING; -- Evita duplicatas
    
    RAISE LOG 'Student record created for user_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa após INSERT na tabela profiles
DROP TRIGGER IF EXISTS trigger_auto_create_student ON public.profiles;

CREATE TRIGGER trigger_auto_create_student
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_student_record();

-- Criar registros retroativos para estudantes que já existem mas não têm registro
INSERT INTO public.students (user_id, teacher_id, created_at)
SELECT p.id, NULL, NOW()
FROM public.profiles p
LEFT JOIN public.students s ON s.user_id = p.id
WHERE p.user_type = 'student' AND s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON FUNCTION public.auto_create_student_record() IS 'Cria automaticamente um registro na tabela students quando um novo perfil de estudante é criado';
COMMENT ON TRIGGER trigger_auto_create_student ON public.profiles IS 'Trigger que garante criação automática de registros de estudantes';