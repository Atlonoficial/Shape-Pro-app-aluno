-- Expandir sistema de gamificação
-- Adicionar tabelas para rankings e configurações

-- Tabela para rankings mensais
CREATE TABLE IF NOT EXISTS public.monthly_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  month DATE NOT NULL,
  position INTEGER NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_rankings ENABLE ROW LEVEL SECURITY;

-- Políticas para rankings
CREATE POLICY "Users can view own rankings" ON public.monthly_rankings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student rankings" ON public.monthly_rankings
  FOR SELECT USING (is_teacher_of(auth.uid(), user_id));

CREATE POLICY "System can manage rankings" ON public.monthly_rankings
  FOR ALL USING (auth.role() = 'service_role');

-- Tabela para configurações de gamificação por professor
CREATE TABLE IF NOT EXISTS public.gamification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  points_workout INTEGER NOT NULL DEFAULT 75,
  points_checkin INTEGER NOT NULL DEFAULT 10,
  points_meal_log INTEGER NOT NULL DEFAULT 25,
  points_progress_update INTEGER NOT NULL DEFAULT 100,
  points_goal_achieved INTEGER NOT NULL DEFAULT 300,
  points_assessment INTEGER NOT NULL DEFAULT 150,
  points_medical_exam INTEGER NOT NULL DEFAULT 100,
  points_ai_interaction INTEGER NOT NULL DEFAULT 5,
  points_teacher_message INTEGER NOT NULL DEFAULT 20,
  streak_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  max_daily_points INTEGER NOT NULL DEFAULT 500,
  level_up_bonus INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações
CREATE POLICY "Teachers can manage own settings" ON public.gamification_settings
  FOR ALL USING (auth.uid() = teacher_id);

-- Tabela para desafios especiais
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'weekly',
  target_value INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 100,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  participants UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Políticas para desafios
CREATE POLICY "Teachers can manage own challenges" ON public.challenges
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view teacher challenges" ON public.challenges
  FOR SELECT USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.user_id = auth.uid() AND s.teacher_id = challenges.teacher_id
    )
  );

-- Tabela para participação em desafios
CREATE TABLE IF NOT EXISTS public.challenge_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL,
  user_id UUID NOT NULL,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- Políticas para participações
CREATE POLICY "Users can view own participations" ON public.challenge_participations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own participations" ON public.challenge_participations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON public.challenge_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can view student participations" ON public.challenge_participations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = challenge_participations.challenge_id AND c.teacher_id = auth.uid()
    )
  );

-- Função para calcular ranking mensal
CREATE OR REPLACE FUNCTION public.update_monthly_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  student_record RECORD;
  position_counter INTEGER;
BEGIN
  -- Para cada professor, calcular rankings
  FOR student_record IN
    SELECT DISTINCT s.teacher_id
    FROM students s
    WHERE s.teacher_id IS NOT NULL
  LOOP
    -- Limpar rankings existentes do mês atual
    DELETE FROM public.monthly_rankings 
    WHERE teacher_id = student_record.teacher_id 
    AND month = current_month;
    
    -- Inserir novos rankings ordenados por pontos
    position_counter := 1;
    
    INSERT INTO public.monthly_rankings (user_id, teacher_id, month, position, total_points)
    SELECT 
      up.user_id,
      student_record.teacher_id,
      current_month,
      ROW_NUMBER() OVER (ORDER BY up.total_points DESC),
      up.total_points
    FROM user_points up
    JOIN students s ON s.user_id = up.user_id
    WHERE s.teacher_id = student_record.teacher_id
    ORDER BY up.total_points DESC;
  END LOOP;
END;
$$;

-- Função melhorada para dar pontos com configurações personalizadas
CREATE OR REPLACE FUNCTION public.award_points_enhanced(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}',
  p_custom_points INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      WHEN 'progress_updated' THEN points_to_award := settings.points_progress_update;
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
$$;

-- Adicionar triggers para auto-award de pontos em várias tabelas
CREATE OR REPLACE FUNCTION public.auto_award_workout_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM public.award_points_enhanced(
      NEW.user_id,
      'training_completed',
      'Treino completado: ' || COALESCE(NEW.name, 'Treino'),
      jsonb_build_object('workout_id', NEW.id, 'duration', NEW.duration)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para workout_sessions (assumindo que existe)
-- CREATE TRIGGER auto_award_workout_points_trigger
--   AFTER UPDATE ON workout_sessions
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_award_workout_points();

-- Função para award pontos em meal logs
CREATE OR REPLACE FUNCTION public.auto_award_meal_points()
RETURNS trigger
LANGUAGE plpgsql  
AS $$
BEGIN
  IF NEW.consumed = true AND (OLD IS NULL OR OLD.consumed = false) THEN
    PERFORM public.award_points_enhanced(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para meal_logs
CREATE TRIGGER auto_award_meal_points_trigger
  AFTER INSERT OR UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_meal_points();

-- Função para award pontos em progress updates
CREATE OR REPLACE FUNCTION public.auto_award_progress_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.award_points_enhanced(
    NEW.user_id,
    'progress_updated',
    'Progresso atualizado',
    jsonb_build_object('progress_type', NEW.type, 'value', NEW.value)
  );
  RETURN NEW;
END;
$$;

-- Trigger para progress
CREATE TRIGGER auto_award_progress_points_trigger
  AFTER INSERT ON progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_progress_points();

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_monthly_rankings_teacher_month ON public.monthly_rankings(teacher_id, month);
CREATE INDEX IF NOT EXISTS idx_gamification_activities_user_date ON public.gamification_activities(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_challenges_teacher_active ON public.challenges(teacher_id, is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user ON public.challenge_participations(user_id, challenge_id);

-- Atualizar função de trigger para updated_at
CREATE TRIGGER update_monthly_rankings_updated_at
  BEFORE UPDATE ON public.monthly_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gamification_settings_updated_at
  BEFORE UPDATE ON public.gamification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_participations_updated_at
  BEFORE UPDATE ON public.challenge_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();