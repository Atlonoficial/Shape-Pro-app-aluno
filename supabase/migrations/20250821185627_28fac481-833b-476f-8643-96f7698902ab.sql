-- Criar job automático para limpeza de mensagens (executa diariamente às 2h)
SELECT cron.schedule(
  'cleanup-old-chat-messages',
  '0 2 * * *', -- Todo dia às 2:00 AM
  $$
  SELECT public.cleanup_old_chat_messages();
  $$
);

-- Função para buscar estatísticas de chat do professor
CREATE OR REPLACE FUNCTION public.get_chat_statistics(teacher_id_param uuid)
RETURNS TABLE(
  total_conversations integer,
  active_conversations integer,
  total_messages integer,
  messages_today integer,
  unread_messages integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM conversations WHERE teacher_id = teacher_id_param),
    (SELECT COUNT(*)::integer FROM conversations WHERE teacher_id = teacher_id_param AND is_active = true),
    (SELECT COUNT(*)::integer FROM chat_messages cm 
     JOIN conversations c ON c.id = cm.conversation_id 
     WHERE c.teacher_id = teacher_id_param),
    (SELECT COUNT(*)::integer FROM chat_messages cm 
     JOIN conversations c ON c.id = cm.conversation_id 
     WHERE c.teacher_id = teacher_id_param 
     AND DATE(cm.created_at) = CURRENT_DATE),
    (SELECT COALESCE(SUM(unread_count_teacher), 0)::integer FROM conversations 
     WHERE teacher_id = teacher_id_param);
END;
$$;