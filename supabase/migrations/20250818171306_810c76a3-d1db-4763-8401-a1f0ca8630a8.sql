-- Update teacher booking settings to use more reasonable defaults
UPDATE teacher_booking_settings 
SET minimum_advance_minutes = 120  -- 2 hours instead of 15 hours (900 minutes)
WHERE teacher_id = '0d5398c2-278e-4853-b980-f36961795e52';