-- Function to sync student plan changes with plan_subscriptions table
CREATE OR REPLACE FUNCTION sync_student_plan_subscription()
RETURNS TRIGGER AS $$
DECLARE
  existing_subscription_id UUID;
  plan_catalog_data RECORD;
BEGIN
  -- Only proceed if active_plan or membership_expiry changed
  IF (TG_OP = 'UPDATE' AND (OLD.active_plan IS DISTINCT FROM NEW.active_plan OR OLD.membership_expiry IS DISTINCT FROM NEW.membership_expiry)) OR TG_OP = 'INSERT' THEN
    
    -- Check if there's an existing active subscription
    SELECT id INTO existing_subscription_id 
    FROM plan_subscriptions 
    WHERE student_user_id = NEW.user_id 
      AND status = 'active' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If student has an active plan (not free/null), ensure plan_subscriptions record exists
    IF NEW.active_plan IS NOT NULL AND NEW.active_plan != '' AND NEW.active_plan != 'free' THEN
      
      -- Get plan catalog data
      SELECT * INTO plan_catalog_data 
      FROM plan_catalog 
      WHERE id::text = NEW.active_plan OR name = NEW.active_plan 
      LIMIT 1;
      
      -- If existing subscription, update it
      IF existing_subscription_id IS NOT NULL THEN
        UPDATE plan_subscriptions 
        SET 
          plan_id = COALESCE(plan_catalog_data.id::text, NEW.active_plan),
          status = CASE WHEN NEW.membership_status = 'active' THEN 'active' ELSE 'inactive' END,
          end_at = NEW.membership_expiry,
          updated_at = NOW()
        WHERE id = existing_subscription_id;
        
        RAISE NOTICE 'Updated existing subscription % for student %', existing_subscription_id, NEW.user_id;
      ELSE
        -- Create new subscription record
        INSERT INTO plan_subscriptions (
          student_user_id,
          teacher_id,
          plan_id,
          status,
          start_at,
          end_at,
          created_at,
          updated_at
        ) VALUES (
          NEW.user_id,
          NEW.teacher_id,
          COALESCE(plan_catalog_data.id::text, NEW.active_plan),
          CASE WHEN NEW.membership_status = 'active' THEN 'active' ELSE 'inactive' END,
          COALESCE(NEW.created_at, NOW()),
          NEW.membership_expiry,
          NOW(),
          NOW()
        );
        
        RAISE NOTICE 'Created new subscription for student % with plan %', NEW.user_id, NEW.active_plan;
      END IF;
    ELSE
      -- If no active plan, deactivate existing subscriptions
      IF existing_subscription_id IS NOT NULL THEN
        UPDATE plan_subscriptions 
        SET 
          status = 'inactive',
          updated_at = NOW()
        WHERE id = existing_subscription_id;
        
        RAISE NOTICE 'Deactivated subscription % for student %', existing_subscription_id, NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for students table changes
DROP TRIGGER IF EXISTS trigger_sync_student_plan_subscription ON students;
CREATE TRIGGER trigger_sync_student_plan_subscription
  AFTER INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_plan_subscription();

-- Enable realtime for plan_subscriptions table to ensure proper real-time updates
ALTER TABLE plan_subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_subscriptions;

-- Also ensure students table is properly configured for realtime
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE students;