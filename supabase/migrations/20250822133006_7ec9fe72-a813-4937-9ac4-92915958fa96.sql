-- Corrigir a função auto_award_progress_points para usar o tipo correto
CREATE OR REPLACE FUNCTION public.auto_award_progress_points()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM public.award_points_enhanced(
    NEW.user_id,
    'progress_logged',
    'Progresso atualizado',
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value)
  );
  RETURN NEW;
END;
$function$;

-- Verificar se award_points_enhanced aceita progress_logged corretamente
CREATE OR REPLACE FUNCTION public.award_points_enhanced(p_user_id uuid, p_activity_type text, p_description text DEFAULT ''::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_custom_points integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  points_to_award INTEGER := 0;
  teacher_id_var UUID;
  settings RECORD;
  current_points INTEGER := 0;
  new_level INTEGER;
  old_level INTEGER := 1;
  daily_points INTEGER := 0;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Buscar teacher_id do usuário
  SELECT s.teacher_id INTO teacher_id_var
  FROM students s
  WHERE s.user_id = p_user_id
  LIMIT 1;
  
  IF teacher_id_var IS NULL THEN
    RETURN; -- Não é um estudante válido
  END IF;
  
  -- Buscar configurações do professor
  SELECT * INTO settings
  FROM gamification_settings gs
  WHERE gs.teacher_id = teacher_id_var;
  
  -- Se não tem configurações, usar padrões
  IF NOT FOUND THEN
    INSERT INTO gamification_settings (teacher_id) VALUES (teacher_id_var);
    SELECT * INTO settings FROM gamification_settings WHERE teacher_id = teacher_id_var;
  END IF;
  
  -- Calcular pontos baseado na atividade
  IF p_custom_points IS NOT NULL THEN
    points_to_award := p_custom_points;
  ELSE
    CASE p_activity_type
      WHEN 'training_completed' THEN points_to_award := settings.points_workout;
      WHEN 'daily_checkin' THEN points_to_award := settings.points_checkin;
      WHEN 'meal_logged' THEN points_to_award := settings.points_meal_log;
      WHEN 'progress_logged' THEN points_to_award := settings.points_progress_update;
      WHEN 'goal_achieved' THEN points_to_award := settings.points_goal_achieved;
      WHEN 'assessment_completed' THEN points_to_award := settings.points_assessment;
      WHEN 'medical_exam_uploaded' THEN points_to_award := settings.points_medical_exam;
      WHEN 'ai_interaction' THEN points_to_award := settings.points_ai_interaction;
      WHEN 'teacher_message' THEN points_to_award := settings.points_teacher_message;
      WHEN 'appointment_attended' THEN points_to_award := settings.points_workout;
      ELSE points_to_award := 10; -- Padrão
    END CASE;
  END IF;
  
  -- Verificar limite diário
  SELECT COALESCE(SUM(ga.points_earned), 0) INTO daily_points
  FROM gamification_activities ga
  WHERE ga.user_id = p_user_id
  AND DATE(ga.created_at) = today_date;
  
  IF daily_points + points_to_award > settings.max_daily_points THEN
    points_to_award := GREATEST(0, settings.max_daily_points - daily_points);
  END IF;
  
  IF points_to_award <= 0 THEN
    RETURN; -- Não dar pontos negativos ou zero
  END IF;
  
  -- Buscar nível atual
  SELECT level, total_points INTO old_level, current_points 
  FROM user_points 
  WHERE user_id = p_user_id;
  
  IF old_level IS NULL THEN 
    old_level := 1; 
    current_points := 0;
  END IF;
  
  -- Inserir atividade
  INSERT INTO gamification_activities (
    user_id, activity_type, points_earned, description, metadata
  ) VALUES (
    p_user_id, p_activity_type, points_to_award, p_description, p_metadata
  );
  
  -- Upsert pontos do usuário
  INSERT INTO user_points (user_id, total_points, level, last_activity_date)
  VALUES (p_user_id, points_to_award, public.calculate_user_level(points_to_award), CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + points_to_award,
    level = public.calculate_user_level(user_points.total_points + points_to_award),
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  RETURNING level INTO new_level;
  
  -- Verificar se subiu de nível
  IF new_level > old_level THEN
    -- Dar pontos bonus por subir de nível
    UPDATE user_points 
    SET total_points = total_points + settings.level_up_bonus
    WHERE user_id = p_user_id;
    
    -- Registrar atividade de nível
    INSERT INTO gamification_activities (
      user_id, activity_type, points_earned, description, metadata
    ) VALUES (
      p_user_id, 'level_up', settings.level_up_bonus, 
      'Subiu para o nível ' || new_level, 
      jsonb_build_object('level', new_level, 'previous_level', old_level)
    );
  END IF;
  
  -- Atualizar rankings mensais
  PERFORM update_monthly_rankings();
END;
$function$;