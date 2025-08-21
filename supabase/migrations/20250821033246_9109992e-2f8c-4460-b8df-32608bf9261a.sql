-- Create progress tracking table for gamification
CREATE TABLE IF NOT EXISTS public.progress_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'weight', 'body_fat', 'muscle_mass', 'measurements', etc.
  value numeric NOT NULL,
  unit text NOT NULL, -- 'kg', 'cm', '%', etc.
  notes text,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progress_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert own progress"
ON public.progress_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress"
ON public.progress_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.progress_records FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student progress"
ON public.progress_records FOR SELECT
USING (is_teacher_of(auth.uid(), user_id));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_progress_records_user_id ON public.progress_records(user_id, created_at DESC);

-- Add trigger for automatic progress points
DROP TRIGGER IF EXISTS trigger_award_progress_points ON progress_records;
CREATE TRIGGER trigger_award_progress_points
  AFTER INSERT ON progress_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_progress_points();

-- Enable real-time
ALTER TABLE public.progress_records REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress_records;