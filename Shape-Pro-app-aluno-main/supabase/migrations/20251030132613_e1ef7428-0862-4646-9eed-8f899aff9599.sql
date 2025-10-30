-- Create user_daily_activity table to track daily app access
CREATE TABLE IF NOT EXISTS public.user_daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date 
  ON public.user_daily_activity(user_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_daily_activity_date 
  ON public.user_daily_activity(activity_date DESC);

-- Enable RLS
ALTER TABLE public.user_daily_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily activity"
  ON public.user_daily_activity
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily activity"
  ON public.user_daily_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activity"
  ON public.user_daily_activity
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to register daily activity (UPSERT)
CREATE OR REPLACE FUNCTION public.register_daily_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_daily_activity (user_id, activity_date, last_active_at)
  VALUES (auth.uid(), CURRENT_DATE, now())
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET last_active_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_daily_activity() TO authenticated;

-- Populate historical data from workout_sessions
INSERT INTO public.user_daily_activity (user_id, activity_date, last_active_at, created_at)
SELECT DISTINCT 
  user_id,
  DATE(start_time) as activity_date,
  start_time as last_active_at,
  start_time as created_at
FROM public.workout_sessions
WHERE start_time IS NOT NULL
ON CONFLICT (user_id, activity_date) DO NOTHING;

-- Populate historical data from ai_usage_stats
INSERT INTO public.user_daily_activity (user_id, activity_date, last_active_at, created_at)
SELECT DISTINCT 
  user_id,
  usage_date as activity_date,
  created_at as last_active_at,
  created_at
FROM public.ai_usage_stats
WHERE usage_date IS NOT NULL
ON CONFLICT (user_id, activity_date) DO NOTHING;