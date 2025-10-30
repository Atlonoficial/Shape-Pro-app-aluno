-- Test the function directly and clean up duplicate appointments at 09:00
SELECT slot_date, slot_start, slot_end 
FROM list_available_slots_improved('0d5398c2-278e-4853-b980-f36961795e52'::uuid, '2025-08-18'::date, '2025-08-18'::date, 60);

-- Clean up the duplicate appointment at 09:00 - keep only the confirmed one
UPDATE appointments 
SET status = 'cancelled',
    cancellation_reason = 'Duplicate appointment - keeping confirmed version',
    cancelled_at = now()
WHERE id = '43ece0c1-7030-4c56-935d-93353d8fc8a0'
  AND status = 'cancelled';