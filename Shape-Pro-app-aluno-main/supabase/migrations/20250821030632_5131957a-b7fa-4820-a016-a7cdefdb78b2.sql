-- Security improvements: Fix rate limit table and make user_id columns NOT NULL where appropriate

-- First drop the existing rate_limit_log table if it exists
DROP TABLE IF EXISTS public.rate_limit_log CASCADE;

-- Make user_id NOT NULL in critical tables where user association is required
ALTER TABLE progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE meal_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workout_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE course_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE subscribers ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraints for better referential integrity
ALTER TABLE progress 
ADD CONSTRAINT fk_progress_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE meal_logs 
ADD CONSTRAINT fk_meal_logs_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE workout_sessions 
ADD CONSTRAINT fk_workout_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE course_progress 
ADD CONSTRAINT fk_course_progress_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE subscribers 
ADD CONSTRAINT fk_subscribers_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);

-- Recreate rate limiting table for edge functions with correct structure
CREATE TABLE public.rate_limit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for rate limiting queries
CREATE INDEX idx_rate_limit_log_ip_endpoint ON rate_limit_log(ip_address, endpoint, window_start);

-- Enable RLS on rate_limit_log
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for rate_limit_log (service role only)
CREATE POLICY "Service role can manage rate limits" ON rate_limit_log
FOR ALL USING (auth.role() = 'service_role');