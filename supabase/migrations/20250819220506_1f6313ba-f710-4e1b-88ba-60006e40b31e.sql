-- Remove constraint atual que não permite "physical_assessment"
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_type_check;

-- Adiciona nova constraint incluindo "physical_assessment"
ALTER TABLE progress ADD CONSTRAINT progress_type_check 
CHECK (type = ANY (ARRAY['workout'::text, 'weight'::text, 'meal'::text, 'measurement'::text, 'physical_assessment'::text]));

-- Adicionar índice para melhor performance nas consultas de avaliação física
CREATE INDEX IF NOT EXISTS idx_progress_type_physical_assessment 
ON progress(user_id, type, date) 
WHERE type = 'physical_assessment';