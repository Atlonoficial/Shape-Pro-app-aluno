-- Função melhorada para prevenir duplicações de pontos
-- CORREÇÃO: Implementa verificação de timestamp e metadata para evitar duplicatas

CREATE OR REPLACE FUNCTION award_points_enhanced_v3(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_custom_points INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_points INTEGER;
  v_current_total INTEGER := 0;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_activity_id UUID;
  v_settings RECORD;
  v_existing_activity RECORD;
  v_duplicate_check_minutes INTEGER := 5; -- Janela de 5 minutos para detectar duplicatas
BEGIN
  -- Verificação de duplicação baseada em timestamp e metadata
  -- Para daily_checkin: verificar se já existe hoje
  IF p_activity_type = 'daily_checkin' THEN
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND DATE(created_at) = CURRENT_DATE;
      
    IF FOUND THEN
      RAISE NOTICE 'Daily checkin already exists for user % today', p_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Check-in diário já realizado hoje',
        'duplicate', true
      );
    END IF;
  -- Para meal_logged: verificar meal_id e data
  ELSIF p_activity_type = 'meal_logged' AND p_metadata ? 'meal_id' THEN
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND metadata->>'meal_id' = p_metadata->>'meal_id'
      AND metadata->>'date' = p_metadata->>'date';
      
    IF FOUND THEN
      RAISE NOTICE 'Meal log already exists for user % with meal_id % and date %', 
        p_user_id, p_metadata->>'meal_id', p_metadata->>'date';
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Refeição já registrada',
        'duplicate', true
      );
    END IF;
  -- Para progress_logged: verificar janela de tempo para mesmo tipo
  ELSIF p_activity_type = 'progress_logged' AND p_metadata ? 'progress_type' THEN
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND metadata->>'progress_type' = p_metadata->>'progress_type'
      AND created_at > NOW() - INTERVAL '5 minutes';
      
    IF FOUND THEN
      RAISE NOTICE 'Progress log duplicated for user % with type % within 5 minutes', 
        p_user_id, p_metadata->>'progress_type';
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Progresso já registrado recentemente',
        'duplicate', true
      );
    END IF;
  -- Para outros tipos: verificar janela geral de tempo
  ELSE
    SELECT * INTO v_existing_activity
    FROM gamification_activities
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND created_at > NOW() - INTERVAL '2 minutes';
      
    IF FOUND THEN
      RAISE NOTICE 'Activity % duplicated for user % within 2 minutes', p_activity_type, p_user_id;
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

  RAISE NOTICE 'Points awarded successfully: % points for % to user %', v_points, p_activity_type, p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'total_points', v_current_total + CASE WHEN v_new_level > v_old_level THEN v_settings.level_up_bonus ELSE 0 END,
    'level', v_new_level,
    'level_up', v_new_level > v_old_level,
    'activity_id', v_activity_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;