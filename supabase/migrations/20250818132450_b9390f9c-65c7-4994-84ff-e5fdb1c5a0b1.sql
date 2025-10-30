-- Update booking settings to allow same day booking
UPDATE teacher_booking_settings 
SET allow_same_day = true
WHERE teacher_id = '0d5398c2-278e-4853-b980-f36961795e52';