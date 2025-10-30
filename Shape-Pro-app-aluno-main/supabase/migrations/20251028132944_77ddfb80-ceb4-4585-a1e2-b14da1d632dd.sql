-- Transfer whey protein product to correct instructor
UPDATE products 
SET instructor_id = '2db424b4-08d2-4ad0-9dd0-971eaab960e1',
    updated_at = now()
WHERE id = '41074a1b-f29d-4fdd-bfe3-d4e8e73096ba';