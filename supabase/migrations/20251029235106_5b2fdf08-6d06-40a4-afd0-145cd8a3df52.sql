-- Tabela para rastrear uso diário do AI assistant
CREATE TABLE public.ai_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Um registro por usuário por dia
  UNIQUE(user_id, usage_date)
);

-- Índice para performance
CREATE INDEX idx_ai_usage_user_date ON public.ai_usage_stats(user_id, usage_date);

-- RLS Policies
ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage stats" 
ON public.ai_usage_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage stats" 
ON public.ai_usage_stats 
FOR ALL 
USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_ai_usage_stats_updated_at
  BEFORE UPDATE ON public.ai_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.ai_usage_stats IS 'Rastreamento de uso diário do AI Assistant';
COMMENT ON COLUMN public.ai_usage_stats.daily_count IS 'Número de perguntas feitas no dia';