-- Função para limpar mensagens antigas (3 meses)
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete messages older than 3 months
  DELETE FROM public.chat_messages 
  WHERE created_at < (now() - interval '3 months');
  
  -- Log cleanup activity
  RAISE NOTICE 'Cleaned chat messages older than 3 months';
END;
$$;

-- Função para buscar nome do professor por ID
CREATE OR REPLACE FUNCTION public.get_teacher_name(teacher_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Função para buscar conversas do professor com dados dos alunos
CREATE OR REPLACE FUNCTION public.get_teacher_conversations(teacher_id_param uuid)
RETURNS TABLE(
  conversation_id text,
  student_id uuid,
  student_name text,
  student_email text,
  last_message text,
  last_message_at timestamp with time zone,
  unread_count integer,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.student_id,
    COALESCE(p.name, p.email) as student_name,
    p.email as student_email,
    c.last_message,
    c.last_message_at,
    c.unread_count_teacher as unread_count,
    c.is_active
  FROM public.conversations c
  JOIN public.profiles p ON p.id = c.student_id
  WHERE c.teacher_id = teacher_id_param
  AND c.is_active = true
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;