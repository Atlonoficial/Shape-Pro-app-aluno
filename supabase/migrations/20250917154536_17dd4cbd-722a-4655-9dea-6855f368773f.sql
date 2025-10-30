-- SECURITY FIX: Fix remaining function search_path issues
-- Update all functions that don't have proper search_path settings

CREATE OR REPLACE FUNCTION public.refresh_teacher_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Refresh apenas para o professor específico (mais eficiente)
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.teacher_payment_metrics;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_meal_rotation(p_nutrition_plan_id uuid, p_meal_type text, p_week_number integer, p_day_of_week integer, p_meal_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rotation_id UUID;
BEGIN
  -- Inserir ou atualizar rotação de refeição
  INSERT INTO meal_rotations (
    nutrition_plan_id,
    meal_type,
    week_number,
    day_of_week,
    meal_id
  )
  VALUES (
    p_nutrition_plan_id,
    p_meal_type,
    p_week_number,
    p_day_of_week,
    p_meal_id
  )
  ON CONFLICT (nutrition_plan_id, meal_type, week_number, day_of_week)
  DO UPDATE SET meal_id = EXCLUDED.meal_id
  RETURNING id INTO rotation_id;
  
  RETURN rotation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_teacher_payment_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_conversation_messages(p_conversation_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
BEGIN
  -- Verificar se o usuário é participante da conversa
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id 
    AND (c.teacher_id = uid OR c.student_id = uid)
  ) THEN
    RAISE EXCEPTION 'Não autorizado a limpar esta conversa';
  END IF;

  -- Deletar todas as mensagens da conversa
  DELETE FROM public.chat_messages 
  WHERE conversation_id = p_conversation_id;
  
  -- Resetar counters e última mensagem
  UPDATE public.conversations 
  SET 
    last_message = NULL,
    last_message_at = NULL,
    unread_count_teacher = 0,
    unread_count_student = 0,
    updated_at = now()
  WHERE id = p_conversation_id;
END;
$function$;

-- SECURITY FIX: Remove materialized view from API exposure
-- Revoke public access to materialized view that shouldn't be exposed
REVOKE ALL ON public.teacher_payment_metrics FROM anon;
REVOKE ALL ON public.teacher_payment_metrics FROM authenticated;

-- Only allow access through the secure function
GRANT SELECT ON public.teacher_payment_metrics TO service_role;

-- SECURITY FIX: Add additional input sanitization for chat messages
CREATE OR REPLACE FUNCTION public.sanitize_chat_input(input_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- More comprehensive input validation for chat
  IF input_text IS NULL OR LENGTH(input_text) > 5000 THEN
    RETURN FALSE;
  END IF;
  
  -- Block potential XSS and injection attempts
  IF input_text ILIKE '%<script%' OR
     input_text ILIKE '%javascript:%' OR
     input_text ILIKE '%data:text/html%' OR
     input_text ILIKE '%<iframe%' OR
     input_text ILIKE '%<object%' OR
     input_text ILIKE '%<embed%' OR
     input_text ILIKE '%eval(%' OR
     input_text ILIKE '%document.%' OR
     input_text ILIKE '%window.%' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;