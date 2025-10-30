-- Extend Sunday availability to match other weekdays (until 18:00)
UPDATE teacher_availability 
SET end_time = '18:00:00', 
    updated_at = now()
WHERE teacher_id = '0d5398c2-278e-4853-b980-f36961795e52' 
  AND weekday = 0;