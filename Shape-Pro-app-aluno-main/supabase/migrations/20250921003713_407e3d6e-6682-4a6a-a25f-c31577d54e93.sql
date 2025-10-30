-- Criar tabela de configurações de feedback do professor
CREATE TABLE public.teacher_feedback_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (feedback_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  feedback_days INTEGER[] NOT NULL DEFAULT '{5}', -- Array de dias da semana (0=domingo, 1=segunda, etc)
  custom_questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id)
);

-- Enable RLS
ALTER TABLE public.teacher_feedback_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can manage own feedback settings"
ON public.teacher_feedback_settings
FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_teacher_feedback_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_teacher_feedback_settings_updated_at
  BEFORE UPDATE ON public.teacher_feedback_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_feedback_settings_updated_at();