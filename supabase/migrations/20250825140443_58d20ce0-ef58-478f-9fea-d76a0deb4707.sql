-- FASE 1: Remover triggers duplicados e manter apenas um por tipo
-- Remover triggers duplicados
DROP TRIGGER IF EXISTS trigger_auto_award_workout_points ON workout_sessions;
DROP TRIGGER IF EXISTS auto_award_meal_points_trigger ON meal_logs;
DROP TRIGGER IF EXISTS auto_award_progress_points_trigger ON progress;

-- FASE 2: Limpar dados duplicados na tabela gamification_activities
-- Criar tabela temporária com atividades únicas
CREATE TEMP TABLE unique_activities AS
SELECT DISTINCT ON (user_id, activity_type, DATE(created_at), metadata)
  id, user_id, activity_type, points_earned, description, metadata, created_at
FROM gamification_activities
ORDER BY user_id, activity_type, DATE(created_at), metadata, created_at DESC;

-- Backup das atividades duplicadas antes de deletar
CREATE TABLE IF NOT EXISTS gamification_activities_backup AS
SELECT * FROM gamification_activities;

-- Deletar todas as atividades e inserir apenas as únicas
DELETE FROM gamification_activities;
INSERT INTO gamification_activities SELECT * FROM unique_activities;

-- FASE 3: Recalcular pontos corretos
-- Limpar user_points e recalcular
DELETE FROM user_points;

-- Recalcular pontos totais por usuário (corrigido o cast para integer)
INSERT INTO user_points (user_id, total_points, level, last_activity_date, current_streak, longest_streak)
SELECT 
  ga.user_id,
  COALESCE(SUM(ga.points_earned), 0) as total_points,
  public.calculate_user_level(COALESCE(SUM(ga.points_earned), 0)::integer) as level,
  COALESCE(MAX(DATE(ga.created_at)), CURRENT_DATE) as last_activity_date,
  0 as current_streak,
  0 as longest_streak
FROM gamification_activities ga
GROUP BY ga.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_points = EXCLUDED.total_points,
  level = EXCLUDED.level,
  last_activity_date = EXCLUDED.last_activity_date;

-- FASE 4: Criar função melhorada para evitar duplicações
CREATE OR REPLACE FUNCTION public.award_points_enhanced_v2(
  p_user_id uuid, 
  p_activity_type text, 
  p_description text DEFAULT ''::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_custom_points integer DEFAULT NULL::integer
) RETURNS void
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
  activity_exists BOOLEAN := false;
BEGIN
  -- Verificar se já existe atividade similar hoje (prevenção de duplicação)
  SELECT EXISTS(
    SELECT 1 FROM gamification_activities ga
    WHERE ga.user_id = p_user_id
    AND ga.activity_type = p_activity_type 
    AND DATE(ga.created_at) = today_date
    AND ga.metadata = p_metadata
    AND ga.created_at > (now() - interval '1 minute')
  ) INTO activity_exists;
  
  IF activity_exists THEN
    RAISE NOTICE 'Atividade já registrada recentemente, evitando duplicação';
    RETURN;
  END IF;

  -- Buscar teacher_id do usuário
  SELECT s.teacher_id INTO teacher_id_var
  FROM students s
  WHERE s.user_id = p_user_id
  LIMIT 1;
  
  IF teacher_id_var IS NULL THEN
    RAISE NOTICE 'Usuário não é um estudante válido: %', p_user_id;
    RETURN;
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
      ELSE points_to_award := 10;
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
    RETURN;
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
    level = public.calculate_user_level((user_points.total_points + points_to_award)::integer),
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
  
  RAISE NOTICE 'Pontos atribuídos com sucesso: % pontos para usuário %', points_to_award, p_user_id;
END;
$function$;

-- FASE 5: Criar funções de trigger melhoradas
CREATE OR REPLACE FUNCTION public.auto_award_meal_points_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se deve dar pontos (só quando consumed = true)
  IF TG_OP = 'INSERT' AND NEW.consumed = true THEN
    PERFORM public.award_points_enhanced_v2(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.consumed = true AND (OLD.consumed IS NULL OR OLD.consumed = false) THEN
    PERFORM public.award_points_enhanced_v2(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating, 'date', NEW.date)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_award_progress_points_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.award_points_enhanced_v2(
    NEW.user_id,
    'progress_logged',
    'Progresso atualizado: ' || NEW.type,
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value, 'unit', NEW.unit)
  );
  RETURN NEW;
END;
$function$;

-- FASE 6: Recriar triggers usando as novas funções (separados para INSERT e UPDATE)
CREATE TRIGGER auto_award_meal_points_insert_trigger_v2
  AFTER INSERT ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_meal_points_v2();

CREATE TRIGGER auto_award_meal_points_update_trigger_v2
  AFTER UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_meal_points_v2();

CREATE TRIGGER auto_award_progress_points_trigger_v2
  AFTER INSERT ON progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_progress_points_v2();

-- FASE 7: Habilitar realtime para tabelas relevantes
ALTER TABLE gamification_activities REPLICA IDENTITY FULL;
ALTER TABLE user_points REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime se não existirem
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE gamification_activities;
  EXCEPTION WHEN duplicate_object THEN
    -- Tabela já existe na publicação
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_points;
  EXCEPTION WHEN duplicate_object THEN
    -- Tabela já existe na publicação
  END;
END$$;