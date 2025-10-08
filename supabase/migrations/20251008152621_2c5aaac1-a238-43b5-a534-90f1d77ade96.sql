-- ========================================
-- FASE 1: Modificar trigger para não falhar
-- ========================================

CREATE OR REPLACE FUNCTION auto_award_progress_points_v3()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM award_points_enhanced_v3(
      NEW.user_id,
      'progress_logged',
      'Progresso registrado: ' || NEW.metric_type,
      jsonb_build_object(
        'metric_type', NEW.metric_type,
        'value', NEW.value,
        'unit', NEW.unit,
        'progress_id', NEW.id
      )
    );
    RAISE NOTICE '[auto_award_progress_points_v3] ✅ Pontos concedidos com sucesso';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[auto_award_progress_points_v3] ⚠️ Falha ao conceder pontos (mas progresso salvo): %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- ========================================
-- FASE 2: Corrigir dados existentes
-- ========================================

DO $$
BEGIN
  -- 2.1: Criar profiles para usuários sem profile
  INSERT INTO profiles (id, email, name, user_type, tenant_id)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    COALESCE((au.raw_user_meta_data->>'user_type')::text, 'student'),
    (SELECT id FROM tenants LIMIT 1)
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '[FASE 2] Profiles criados para usuários sem profile';

  -- 2.2: Vincular estudantes ao professor padrão do tenant
  INSERT INTO students (user_id, teacher_id, tenant_id)
  SELECT 
    p.id,
    t.default_teacher_id,
    p.tenant_id
  FROM profiles p
  JOIN tenants t ON t.id = p.tenant_id
  WHERE p.user_type = 'student'
    AND t.default_teacher_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM students s 
      WHERE s.user_id = p.id AND s.teacher_id = t.default_teacher_id
    )
  ON CONFLICT (user_id, teacher_id) DO NOTHING;

  RAISE NOTICE '[FASE 2] Estudantes vinculados ao professor padrão';
END $$;

-- ========================================
-- FASE 3: Melhorar award_points_enhanced_v3
-- ========================================

CREATE OR REPLACE FUNCTION award_points_enhanced_v3(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}',
  p_custom_points integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
  v_current_total INTEGER := 0;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_activity_id UUID;
  v_settings RECORD;
  v_existing_activity RECORD;
  v_today DATE := CURRENT_DATE;
  v_week_start DATE;
  v_month_start DATE;
  v_daily_points INTEGER := 0;
BEGIN
  v_week_start := DATE_TRUNC('week', v_today)::DATE;
  v_month_start := DATE_TRUNC('month', v_today)::DATE;

  -- Verificação de duplicação
  IF p_activity_type = 'daily_checkin' THEN
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type AND DATE(created_at) = v_today;
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Check-in diário já realizado hoje', 'duplicate', true);
    END IF;
  ELSIF p_activity_type = 'periodic_feedback' THEN
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type 
      AND metadata->>'teacher_id' = p_metadata->>'teacher_id' AND DATE(created_at) >= v_week_start;
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Feedback já enviado esta semana', 'duplicate', true);
    END IF;
  ELSIF p_activity_type = 'meal_logged' AND p_metadata ? 'meal_id' THEN
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type 
      AND metadata->>'meal_id' = p_metadata->>'meal_id' 
      AND DATE(created_at) = COALESCE((p_metadata->>'date')::date, v_today);
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Refeição já registrada', 'duplicate', true);
    END IF;
  ELSE
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type 
      AND created_at > (NOW() - INTERVAL '1 minute');
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Atividade registrada recentemente', 'duplicate', true);
    END IF;
  END IF;

  -- Buscar configurações com fallback robusto
  SELECT gs.* INTO v_settings FROM gamification_settings gs
  JOIN students s ON s.teacher_id = gs.teacher_id
  WHERE s.user_id = p_user_id LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE '[award_points_enhanced_v3] ⚠️ Sem configurações para user %, usando padrões', p_user_id;
    
    SELECT gs.* INTO v_settings FROM gamification_settings gs WHERE teacher_id IS NULL LIMIT 1;
    
    IF NOT FOUND THEN
      INSERT INTO gamification_settings (
        teacher_id, points_workout, points_checkin, points_meal_log,
        points_progress_update, points_goal_achieved, points_assessment,
        points_medical_exam, points_ai_interaction, points_teacher_message,
        level_up_bonus, max_daily_points
      ) VALUES (
        NULL, 75, 10, 25, 100, 300, 150, 100, 5, 20, 50, 500
      )
      ON CONFLICT DO NOTHING
      RETURNING * INTO v_settings;
      
      IF v_settings IS NULL THEN
        RAISE NOTICE '[award_points_enhanced_v3] ⚠️ Impossível criar settings, salvando sem pontos';
        RETURN jsonb_build_object(
          'success', true, 
          'points_awarded', 0, 
          'message', 'Progresso salvo sem pontos (sem configuração de gamificação)'
        );
      END IF;
    END IF;
  END IF;

  -- Determinar pontos
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
    WHEN 'periodic_feedback' THEN COALESCE(p_custom_points, 50)
    ELSE COALESCE(p_custom_points, 10)
  END;

  -- Verificar limite diário
  SELECT COALESCE(SUM(points_earned), 0) INTO v_daily_points
  FROM gamification_activities WHERE user_id = p_user_id AND DATE(created_at) = v_today;
    
  IF v_daily_points + v_points > v_settings.max_daily_points THEN
    v_points := GREATEST(0, v_settings.max_daily_points - v_daily_points);
    IF v_points <= 0 THEN
      RETURN jsonb_build_object('success', false, 'message', 'Limite diário atingido', 'daily_limit_reached', true);
    END IF;
  END IF;

  -- Inserir atividade
  INSERT INTO gamification_activities (user_id, activity_type, points_earned, description, metadata)
  VALUES (p_user_id, p_activity_type, v_points, COALESCE(p_description, 'Atividade: ' || p_activity_type), p_metadata)
  RETURNING id INTO v_activity_id;

  -- Atualizar pontos e nível
  INSERT INTO user_points (user_id, total_points, last_activity_date)
  VALUES (p_user_id, v_points, v_today)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + v_points,
    last_activity_date = v_today, updated_at = NOW()
  RETURNING total_points, level INTO v_current_total, v_old_level;

  v_new_level := FLOOR(v_current_total / 100.0) + 1;

  IF v_new_level > v_old_level THEN
    UPDATE user_points SET level = v_new_level WHERE user_id = p_user_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM gamification_activities 
      WHERE user_id = p_user_id AND activity_type = 'level_up' 
        AND metadata->>'level' = v_new_level::text AND DATE(created_at) = v_today
    ) THEN
      INSERT INTO gamification_activities (user_id, activity_type, points_earned, description, metadata)
      VALUES (p_user_id, 'level_up', v_settings.level_up_bonus, 'Subiu para nível ' || v_new_level,
        jsonb_build_object('level', v_new_level, 'previous_level', v_old_level));
      UPDATE user_points SET total_points = total_points + v_settings.level_up_bonus WHERE user_id = p_user_id;
      v_current_total := v_current_total + v_settings.level_up_bonus;
    END IF;
  END IF;

  RAISE NOTICE '[award_points_enhanced_v3] ✅ % pontos concedidos para user %', v_points, p_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 'points_awarded', v_points, 'total_points', v_current_total,
    'level', v_new_level, 'level_up', v_new_level > v_old_level, 'activity_id', v_activity_id
  );
END;
$$;