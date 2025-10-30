-- Tabelas para integração com dispositivos wearables (Strava, Garmin, etc.)

-- Tabela para conexões de dispositivos wearables
CREATE TABLE public.wearable_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('strava', 'garmin', 'fitbit')),
  provider_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- RLS para wearable_connections
ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.wearable_connections
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections" ON public.wearable_connections
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public.wearable_connections
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student connections" ON public.wearable_connections
FOR SELECT USING (is_teacher_of(auth.uid(), user_id));

-- Tabela para métricas de saúde
CREATE TABLE public.health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.wearable_connections(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('heart_rate', 'steps', 'calories', 'distance', 'sleep', 'weight')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para health_metrics
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON public.health_metrics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create metrics" ON public.health_metrics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers can view student metrics" ON public.health_metrics
FOR SELECT USING (is_teacher_of(auth.uid(), user_id));

-- Tabela para atividades de treino
CREATE TABLE public.workout_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.wearable_connections(id) ON DELETE CASCADE,
  provider_activity_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  distance_meters NUMERIC,
  duration_seconds INTEGER,
  calories_burned INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain NUMERIC,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, provider_activity_id)
);

-- RLS para workout_activities
ALTER TABLE public.workout_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.workout_activities
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create activities" ON public.workout_activities
FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers can view student activities" ON public.workout_activities
FOR SELECT USING (is_teacher_of(auth.uid(), user_id));

-- Índices para performance
CREATE INDEX idx_wearable_connections_user_provider ON public.wearable_connections(user_id, provider);
CREATE INDEX idx_health_metrics_user_type_date ON public.health_metrics(user_id, metric_type, recorded_at DESC);
CREATE INDEX idx_workout_activities_user_date ON public.workout_activities(user_id, started_at DESC);

-- Trigger para atualizar updated_at em wearable_connections
CREATE OR REPLACE FUNCTION public.update_wearable_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wearable_connections_updated_at
  BEFORE UPDATE ON public.wearable_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wearable_connections_updated_at();