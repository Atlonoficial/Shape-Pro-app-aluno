-- Remove triggers duplicados antigos (v2) que estão causando duplicação de pontos
DROP TRIGGER IF EXISTS auto_award_meal_points_v2_trigger ON meal_logs;
DROP TRIGGER IF EXISTS auto_award_progress_points_v2_trigger ON progress;

-- Remove funções antigas v2
DROP FUNCTION IF EXISTS auto_award_meal_points_v2();
DROP FUNCTION IF EXISTS auto_award_progress_points_v2();

-- Melhorar função v3 para ser mais robusta contra duplicações
CREATE OR REPLACE FUNCTION award_points_enhanced_v3(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_custom_points integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points INTEGER;
  v_current_total INTEGER := 0;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_activity_id UUID;
  v_settings RECORD;
  v_existing_activity RECORD;
  v_duplicate_check_minutes INTEGER := 5;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Verificação rigorosa de duplicação baseada em tipo de atividade
  IF p_activity_type = 'daily_checkin' THEN
    -- Check-in diário: apenas 1 por dia
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND DATE(created_at) = v_today;
      
    IF FOUND THEN
      RAISE NOTICE 'Daily checkin already exists for user % today', p_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Check-in diário já realizado hoje',
        'duplicate', true
      );
    END IF;
    
  ELSIF p_activity_type = 'meal_logged' AND p_metadata ? 'meal_id' THEN
    -- Refeição: verificar por meal_id e data específica
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND metadata->>'meal_id' = p_metadata->>'meal_id'
      AND DATE(created_at) = COALESCE((p_metadata->>'date')::date, v_today);
      
    IF FOUND THEN
      RAISE NOTICE 'Meal log already exists for user % with meal_id % and date %', 
        p_user_id, p_metadata->>'meal_id', COALESCE(p_metadata->>'date', v_today::text);
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Refeição já registrada',
        'duplicate', true
      );
    END IF;
    
  ELSIF p_activity_type = 'progress_logged' THEN
    -- Progresso: verificar por tipo e janela de tempo menor (evita spam)
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND metadata->>'progress_type' = p_metadata->>'progress_type'
      AND created_at > (NOW() - INTERVAL '2 minutes');
      
    IF FOUND THEN
      RAISE NOTICE 'Progress log recently created for user % with type %', 
        p_user_id, p_metadata->>'progress_type';
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Progresso registrado recentemente',
        'duplicate', true
      );
    END IF;
    
  ELSE
    -- Para outros tipos, verificação geral por tempo
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND created_at > (NOW() - INTERVAL '1 minute');
      
    IF FOUND THEN
      RAISE NOTICE 'Recent activity found for user % with type %', p_user_id, p_activity_type;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Atividade registrada recentemente',
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

  IF NOT FOUND THEN
    -- Configurações padrão se não encontradas
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

  -- Verificar limite diário
  DECLARE
    v_daily_points INTEGER := 0;
  BEGIN
    SELECT COALESCE(SUM(points_earned), 0) INTO v_daily_points
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND DATE(created_at) = v_today;
      
    IF v_daily_points + v_points > v_settings.max_daily_points THEN
      v_points := GREATEST(0, v_settings.max_daily_points - v_daily_points);
      
      IF v_points <= 0 THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Limite diário de pontos atingido',
          'daily_limit_reached', true
        );
      END IF;
    END IF;
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
  VALUES (p_user_id, v_points, v_today)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + v_points,
    last_activity_date = v_today,
    updated_at = NOW()
  RETURNING total_points, level INTO v_current_total, v_old_level;

  -- Calcular novo nível
  v_new_level := FLOOR(v_current_total / 100.0) + 1;

  -- Atualizar nível se mudou
  IF v_new_level > v_old_level THEN
    UPDATE user_points 
    SET level = v_new_level 
    WHERE user_id = p_user_id;

    -- Inserir atividade de level up (sem duplicar)
    IF NOT EXISTS (
      SELECT 1 FROM gamification_activities 
      WHERE user_id = p_user_id 
        AND activity_type = 'level_up' 
        AND metadata->>'level' = v_new_level::text
        AND DATE(created_at) = v_today
    ) THEN
      INSERT INTO gamification_activities (
        user_id, activity_type, points_earned, description, metadata
      ) VALUES (
        p_user_id, 'level_up', v_settings.level_up_bonus,
        'Subiu para o nível ' || v_new_level,
        jsonb_build_object('level', v_new_level, 'previous_level', v_old_level)
      );

      UPDATE user_points 
      SET total_points = total_points + v_settings.level_up_bonus
      WHERE user_id = p_user_id;
      
      v_current_total := v_current_total + v_settings.level_up_bonus;
    END IF;
  END IF;

  RAISE NOTICE 'Points awarded successfully: % points for % to user %', v_points, p_activity_type, p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'total_points', v_current_total,
    'level', v_new_level,
    'level_up', v_new_level > v_old_level,
    'activity_id', v_activity_id
  );
END;
$$;