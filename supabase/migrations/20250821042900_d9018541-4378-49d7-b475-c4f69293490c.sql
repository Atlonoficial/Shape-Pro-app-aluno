-- Criar tabela de metas dos usuários
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- peso, cardio, forca, frequencia, general
  target_type TEXT NOT NULL DEFAULT 'numeric', -- numeric, boolean, time
  target_value NUMERIC NOT NULL,
  target_unit TEXT, -- kg, km, minutes, reps, etc
  current_value NUMERIC DEFAULT 0,
  progress_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN target_value > 0 THEN LEAST(100, (current_value / target_value) * 100)
      ELSE 0 
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, paused, cancelled
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_reward INTEGER DEFAULT 100,
  is_challenge_based BOOLEAN DEFAULT false,
  challenge_id UUID REFERENCES public.challenges(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own goals" 
ON public.user_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" 
ON public.user_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" 
ON public.user_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student goals" 
ON public.user_goals 
FOR SELECT 
USING (is_teacher_of(auth.uid(), user_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para auto-completar metas quando atingidas
CREATE OR REPLACE FUNCTION public.check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress_percentage >= 100 AND OLD.status = 'active' AND NEW.status = 'active' THEN
    NEW.status := 'completed';
    NEW.completed_at := now();
    
    -- Dar pontos pela meta completada
    PERFORM public.award_points_enhanced(
      NEW.user_id,
      'goal_achieved',
      'Meta alcançada: ' || NEW.title,
      jsonb_build_object('goal_id', NEW.id, 'category', NEW.category),
      NEW.points_reward
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conclusão de metas
CREATE TRIGGER check_goal_completion_trigger
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_goal_completion();

-- Função para atualizar progresso de metas baseado em dados existentes
CREATE OR REPLACE FUNCTION public.update_goal_progress(p_user_id UUID, p_category TEXT, p_value NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_goals 
  SET 
    current_value = CASE
      WHEN category = 'peso' AND p_category = 'peso' THEN p_value
      WHEN category = 'frequencia' AND p_category = 'frequencia' THEN current_value + p_value
      ELSE current_value + p_value
    END,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND category = p_category 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para performance
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_status ON public.user_goals(status);
CREATE INDEX idx_user_goals_category ON public.user_goals(category);
CREATE INDEX idx_user_goals_teacher_id ON public.user_goals(teacher_id);