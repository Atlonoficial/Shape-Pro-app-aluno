-- Add unique constraint to prevent duplicate gamification activities
-- This prevents duplicate activities within the same second

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_unique_activity_per_day;

-- Create unique index using simpler approach
-- This prevents duplicate activities for same user, type, and timestamp (down to microsecond)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_activity_user_type_time 
ON gamification_activities (user_id, activity_type, created_at);

COMMENT ON INDEX idx_unique_activity_user_type_time IS 'Prevents duplicate gamification activities at the same timestamp for a user';