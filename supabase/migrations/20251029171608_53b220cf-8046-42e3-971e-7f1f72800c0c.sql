-- Fix search_path security warnings in SQL functions
-- BUILD 40: Add explicit search_path to all mutable functions

-- Function 1: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (new.id, new.email, 'student');
  RETURN new;
END;
$$;

-- Function 2: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function 3: check_subscription_access
CREATE OR REPLACE FUNCTION public.check_subscription_access(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  has_active_subscription boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE subscriptions.user_id = check_subscription_access.user_id 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO has_active_subscription;
  
  RETURN has_active_subscription;
END;
$$;

-- Function 4: get_user_teacher_id
CREATE OR REPLACE FUNCTION public.get_user_teacher_id(student_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  teacher_id uuid;
BEGIN
  SELECT subscriptions.teacher_id INTO teacher_id
  FROM subscriptions
  WHERE subscriptions.user_id = student_id
    AND subscriptions.status = 'active'
    AND (subscriptions.expires_at IS NULL OR subscriptions.expires_at > now())
  ORDER BY subscriptions.created_at DESC
  LIMIT 1;
  
  RETURN teacher_id;
END;
$$;

-- Function 5: record_gamification_activity
CREATE OR REPLACE FUNCTION public.record_gamification_activity(
  p_user_id uuid,
  p_activity_type text,
  p_points_earned integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Insert activity record
  INSERT INTO gamification_activities (user_id, activity_type, points_earned)
  VALUES (p_user_id, p_activity_type, p_points_earned);
  
  -- Update user points
  INSERT INTO user_points (user_id, total_points, level)
  VALUES (p_user_id, p_points_earned, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + p_points_earned,
    level = LEAST(100, FLOOR((user_points.total_points + p_points_earned) / 100.0) + 1);
END;
$$;

-- Function 6: increment_notification_count
CREATE OR REPLACE FUNCTION public.increment_notification_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE profiles
  SET unread_notifications = COALESCE(unread_notifications, 0) + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Function 7: decrement_notification_count
CREATE OR REPLACE FUNCTION public.decrement_notification_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    UPDATE profiles
    SET unread_notifications = GREATEST(0, COALESCE(unread_notifications, 0) - 1)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;