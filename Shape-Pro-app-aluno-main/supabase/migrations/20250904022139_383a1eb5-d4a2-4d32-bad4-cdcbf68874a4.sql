-- Add missing columns to feedbacks table for the weekly feedback system
ALTER TABLE public.feedbacks 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS teacher_response text,
ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone;