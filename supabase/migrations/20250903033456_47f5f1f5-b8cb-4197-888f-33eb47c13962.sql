-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA

-- 1. Habilitar RLS na tabela backup
ALTER TABLE public.gamification_activities_backup ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar foreign keys essenciais para integridade referencial
ALTER TABLE public.gamification_activities 
ADD CONSTRAINT fk_gamification_activities_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_points 
ADD CONSTRAINT fk_user_points_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
ADD CONSTRAINT fk_user_achievements_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
ADD CONSTRAINT fk_user_achievements_achievement_id 
FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;

ALTER TABLE public.rewards_items 
ADD CONSTRAINT fk_rewards_items_teacher_id 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reward_redemptions 
ADD CONSTRAINT fk_reward_redemptions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reward_redemptions 
ADD CONSTRAINT fk_reward_redemptions_reward_id 
FOREIGN KEY (reward_id) REFERENCES public.rewards_items(id) ON DELETE CASCADE;

-- 3. Corrigir todas as funções para usar search_path correto
CREATE OR REPLACE FUNCTION public.award_points_enhanced_v4(
  p_user_id uuid, 
  p_activity_type text, 
  p_description text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb, 
  p_custom_points integer DEFAULT NULL::integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_points INTEGER;
  v_current_total INTEGER := 0;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_activity_id UUID;
  v_settings RECORD;
  v_existing_activity RECORD;
BEGIN
  -- Verificação de duplicação baseada em timestamp e metadata
  IF p_activity_type = 'daily_checkin' THEN
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND DATE(created_at) = CURRENT_DATE;
      
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Check-in diário já realizado hoje',
        'duplicate', true
      );
    END IF;
  ELSIF p_activity_type = 'meal_logged' AND p_metadata ? 'meal_id' THEN
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND metadata->>'meal_id' = p_metadata->>'meal_id'
      AND metadata->>'date' = p_metadata->>'date';
      
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Refeição já registrada',
        'duplicate', true
      );
    END IF;
  ELSIF p_activity_type = 'progress_logged' AND p_metadata ? 'progress_type' THEN
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND metadata->>'progress_type' = p_metadata->>'progress_type'
      AND created_at > NOW() - INTERVAL '5 minutes';
      
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Progresso já registrado recentemente',
        'duplicate', true
      );
    END IF;
  ELSE
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND created_at > NOW() - INTERVAL '2 minutes';
      
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Ação já realizada recentemente',
        'duplicate', true
      );
    END IF;
  END IF;

  -- Buscar configurações de pontuação do professor
  SELECT gs.* INTO v_settings
  FROM gamification_settings gs
  JOIN students s ON s.teacher_id = gs.teacher_id
  WHERE s.user_id = p_user_id
  LIMIT 1;

  -- Se não encontrar configurações, usar padrões
  IF NOT FOUND THEN
    v_settings := ROW(
      NULL, NULL, 75, 10, 25, 100, 300, 150, 100, 5, 20, 1.5, 500, 50, NOW(), NOW()
    )::gamification_settings;
  END IF;

  -- Determinar pontos baseado no tipo de atividade
  v_points := CASE p_activity_type
    WHEN 'training_completed' THEN COALESCE(p_custom_points, v_settings.points_workout)
    WHEN 'daily_checkin' THEN COALESCE(p_custom_points, v_settings.points_checkin)
    WHEN 'meal_logged' THEN COALESCE(p_custom_points, v_settings.points_meal_log)
    WHEN 'progress_logged' THEN COALESCE(p_custom_points, v_settings.points_progress_update)
    WHEN 'goal_achieved' THEN COALESCE(p_custom_points, v_settings.points_goal_achieved)
    WHEN 'physical_assessment' THEN COALESCE(p_custom_points, v_settings.points_assessment)
    WHEN 'medical_exam' THEN COALESCE(p_custom_points, v_settings.points_medical_exam)
    WHEN 'ai_interaction' THEN COALESCE(p_custom_points, v_settings.points_ai_interaction)
    WHEN 'teacher_message' THEN COALESCE(p_custom_points, v_settings.points_teacher_message)
    ELSE COALESCE(p_custom_points, 10)
  END;

  -- Inserir atividade de gamificação
  INSERT INTO gamification_activities (
    user_id, activity_type, points_earned, description, metadata
  ) VALUES (
    p_user_id, p_activity_type, v_points, 
    COALESCE(p_description, 'Atividade: ' || p_activity_type),
    p_metadata
  ) RETURNING id INTO v_activity_id;

  -- Atualizar pontos do usuário
  INSERT INTO user_points (user_id, total_points, last_activity_date)
  VALUES (p_user_id, v_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + v_points,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  RETURNING total_points, level INTO v_current_total, v_old_level;

  -- Calcular novo nível
  v_new_level := FLOOR(v_current_total / 100.0) + 1;

  -- Atualizar nível se mudou
  IF v_new_level > v_old_level THEN
    UPDATE user_points 
    SET level = v_new_level 
    WHERE user_id = p_user_id;

    -- Inserir atividade de level up
    INSERT INTO gamification_activities (
      user_id, activity_type, points_earned, description, metadata
    ) VALUES (
      p_user_id, 'level_up', v_settings.level_up_bonus,
      'Subiu para o nível ' || v_new_level,
      jsonb_build_object('level', v_new_level, 'previous_level', v_old_level)
    );

    -- Atualizar total de pontos com bônus
    UPDATE user_points 
    SET total_points = total_points + v_settings.level_up_bonus
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'total_points', v_current_total + CASE WHEN v_new_level > v_old_level THEN v_settings.level_up_bonus ELSE 0 END,
    'level', v_new_level,
    'level_up', v_new_level > v_old_level,
    'activity_id', v_activity_id
  );
END;
$function$;

-- 4. Atualizar triggers para usar nova função
DROP TRIGGER IF EXISTS auto_award_meal_points_trigger ON meal_logs;
DROP TRIGGER IF EXISTS auto_award_progress_points_trigger ON progress;

CREATE OR REPLACE FUNCTION auto_award_meal_points_v4()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.consumed = true THEN
    PERFORM award_points_enhanced_v4(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.consumed = true AND (OLD.consumed IS NULL OR OLD.consumed = false) THEN
    PERFORM award_points_enhanced_v4(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada', 
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION auto_award_progress_points_v4()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM award_points_enhanced_v4(
    NEW.user_id,
    'progress_logged',
    'Progresso atualizado: ' || NEW.type,
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value, 'unit', NEW.unit)
  );
  RETURN NEW;
END;
$function$;

-- Criar triggers atualizados
CREATE TRIGGER auto_award_meal_points_trigger_v4
  AFTER INSERT OR UPDATE ON meal_logs
  FOR EACH ROW EXECUTE FUNCTION auto_award_meal_points_v4();

CREATE TRIGGER auto_award_progress_points_trigger_v4
  AFTER INSERT ON progress
  FOR EACH ROW EXECUTE FUNCTION auto_award_progress_points_v4();

-- 5. Adicionar políticas RLS para tabela backup
CREATE POLICY "Users can view own activities backup" 
ON gamification_activities_backup 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage activities backup" 
ON gamification_activities_backup 
FOR ALL 
USING (auth.role() = 'service_role');

-- 6. Habilitar realtime para tabelas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE gamification_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE user_points;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;