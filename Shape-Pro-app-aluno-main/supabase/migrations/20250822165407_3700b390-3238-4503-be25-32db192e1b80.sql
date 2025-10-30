-- Adicionar campo delivered_at para distinguir entrega de leitura
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Criar função para marcar mensagens como entregues automaticamente
CREATE OR REPLACE FUNCTION public.mark_messages_as_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar como entregue quando inserida via Realtime pelo destinatário
  IF NEW.delivered_at IS NULL THEN
    NEW.delivered_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-marcar como entregue
DROP TRIGGER IF EXISTS auto_mark_delivered ON public.chat_messages;
CREATE TRIGGER auto_mark_delivered
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_messages_as_delivered();

-- Função para marcar mensagens como lidas em batch
CREATE OR REPLACE FUNCTION public.mark_conversation_messages_as_read(p_conversation_id text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marcar como lidas todas as mensagens da conversa que não são do próprio usuário
  UPDATE public.chat_messages 
  SET 
    is_read = true,
    read_at = now()
  WHERE 
    conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND (is_read = false OR is_read IS NULL);
    
  -- Atualizar contador na conversa
  UPDATE public.conversations 
  SET 
    unread_count_student = CASE 
      WHEN EXISTS (SELECT 1 FROM students WHERE user_id = p_user_id) THEN 0 
      ELSE unread_count_student 
    END,
    unread_count_teacher = CASE 
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND user_type = 'teacher') THEN 0 
      ELSE unread_count_teacher 
    END,
    updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;