-- Add trigger for progress table (using existing table)
DROP TRIGGER IF EXISTS trigger_award_progress_points ON progress;
CREATE TRIGGER trigger_award_progress_points
  AFTER INSERT ON progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_progress_points();

-- Enable real-time for existing progress table
ALTER TABLE public.progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress;