-- Function: Criar notificação quando nova mensagem de chat é enviada
CREATE OR REPLACE FUNCTION public.create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  recipient_id UUID;
  conversation_data RECORD;
BEGIN
  -- Buscar dados da conversa
  SELECT student_id, teacher_id 
  INTO conversation_data
  FROM conversations 
  WHERE id = NEW.conversation_id;
  
  -- Determinar destinatário (oposto do sender)
  IF NEW.sender_id = conversation_data.teacher_id THEN
    recipient_id := conversation_data.student_id;
  ELSE
    recipient_id := conversation_data.teacher_id;
  END IF;
  
  -- Buscar nome do sender
  SELECT name INTO sender_name 
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Criar notificação apenas se mensagem for de texto e não estiver deletada
  IF NEW.message_type = 'text' AND NEW.deleted_at IS NULL THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      priority,
      target_users,
      deep_link,
      data,
      created_at
    ) VALUES (
      'Nova mensagem de ' || COALESCE(sender_name, 'Professor'),
      LEFT(NEW.message, 100),
      'message',
      'normal',
      ARRAY[recipient_id],
      '/teacher-chat',
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Executar após inserção de mensagem
DROP TRIGGER IF EXISTS on_chat_message_insert ON chat_messages;
CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notification();

-- Function: Deletar notificações de chat de uma conversa específica
CREATE OR REPLACE FUNCTION public.delete_chat_notifications(
  p_user_id UUID,
  p_conversation_id TEXT
)
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE 
    p_user_id = ANY(target_users) AND
    type = 'message' AND
    data->>'conversation_id' = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;