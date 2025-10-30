-- FASE 1: CORREÇÕES DE SEGURANÇA - CORREÇÃO FINAL DAS FUNÇÕES SEM SEARCH_PATH

-- 1. Corrigir função auto_award_progress_points
CREATE OR REPLACE FUNCTION public.auto_award_progress_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM award_points(
    NEW.user_id,
    25,
    'progress_logged',
    'Progresso atualizado: ' || NEW.type
  );
  RETURN NEW;
END;
$function$;

-- 2. Corrigir função auto_award_workout_points
CREATE OR REPLACE FUNCTION public.auto_award_workout_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM award_points(
    NEW.user_id,
    75,
    'training_completed',
    'Treino completado'
  );
  RETURN NEW;
END;
$function$;

-- 3. Corrigir função check_goal_completion
CREATE OR REPLACE FUNCTION public.check_goal_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se a meta foi completada
  IF NEW.current_value >= NEW.target_value AND OLD.current_value < OLD.target_value THEN
    -- Dar pontos pela meta completada
    PERFORM award_points(
      NEW.user_id,
      200,
      'goal_achieved',
      'Meta alcançada: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Corrigir função mark_conversation_messages_as_read
CREATE OR REPLACE FUNCTION public.mark_conversation_messages_as_read(p_conversation_id text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Marcar mensagens como lidas baseado no tipo de usuário
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND user_type = 'teacher') THEN
    -- Professor lendo mensagens de estudantes
    UPDATE chat_messages 
    SET is_read = true, read_at = NOW()
    WHERE conversation_id = p_conversation_id 
      AND sender_type = 'student'
      AND is_read = false;
      
    -- Resetar contador de não lidas do professor
    UPDATE conversations 
    SET unread_count_teacher = 0,
        updated_at = NOW()
    WHERE id = p_conversation_id;
  ELSE
    -- Estudante lendo mensagens do professor
    UPDATE chat_messages 
    SET is_read = true, read_at = NOW()
    WHERE conversation_id = p_conversation_id 
      AND sender_type = 'teacher'
      AND is_read = false;
      
    -- Resetar contador de não lidas do estudante
    UPDATE conversations 
    SET unread_count_student = 0,
        updated_at = NOW()
    WHERE id = p_conversation_id;
  END IF;
END;
$function$;

-- 5. Corrigir função mark_messages_as_delivered
CREATE OR REPLACE FUNCTION public.mark_messages_as_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.delivered_at = NOW();
  RETURN NEW;
END;
$function$;

-- 6. Corrigir função update_goal_progress
CREATE OR REPLACE FUNCTION public.update_goal_progress(p_user_id uuid, p_category text, p_value numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE goals 
  SET 
    current_value = LEAST(current_value + p_value, target_value),
    updated_at = NOW()
  WHERE user_id = p_user_id 
    AND category = p_category 
    AND status = 'active'
    AND current_value < target_value;
    
  -- Verificar se alguma meta foi completada
  UPDATE goals 
  SET status = 'completed', completed_at = NOW()
  WHERE user_id = p_user_id 
    AND category = p_category 
    AND status = 'active'
    AND current_value >= target_value;
END;
$function$;

-- 7. Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 8. Corrigir função update_user_streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar streak baseado na última atividade
  WITH streak_data AS (
    SELECT 
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_activities,
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE - 1) as yesterday_activities
    FROM gamification_activities 
    WHERE user_id = p_user_id 
      AND DATE(created_at) >= CURRENT_DATE - 1
  )
  UPDATE user_points 
  SET 
    current_streak = CASE 
      WHEN streak_data.today_activities > 0 THEN
        CASE 
          WHEN streak_data.yesterday_activities > 0 THEN current_streak + 1
          ELSE 1 
        END
      ELSE 0 
    END,
    longest_streak = GREATEST(
      longest_streak, 
      CASE 
        WHEN streak_data.today_activities > 0 THEN
          CASE 
            WHEN streak_data.yesterday_activities > 0 THEN current_streak + 1
            ELSE 1 
          END
        ELSE current_streak 
      END
    ),
    updated_at = NOW()
  FROM streak_data
  WHERE user_id = p_user_id;
END;
$function$;