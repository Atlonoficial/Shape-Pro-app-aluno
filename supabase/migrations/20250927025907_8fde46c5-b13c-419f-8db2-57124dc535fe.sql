-- Correção imediata da constraint feedbacks_type_check para incluir periodic_feedback
ALTER TABLE public.feedbacks DROP CONSTRAINT IF EXISTS feedbacks_type_check;

-- Adicionar nova constraint com todos os tipos necessários
ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_type_check 
CHECK (type IN ('general', 'workout', 'nutrition', 'progress', 'appointment', 'periodic_feedback'));

-- Verificar se existem registros com tipos não permitidos
SELECT DISTINCT type FROM public.feedbacks WHERE type NOT IN ('general', 'workout', 'nutrition', 'progress', 'appointment', 'periodic_feedback');

-- Criar índice para melhorar performance nas consultas de feedback
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_teacher_type_date 
ON public.feedbacks(student_id, teacher_id, type, created_at);

-- Criar índice para consultas de duplicatas por período
CREATE INDEX IF NOT EXISTS idx_feedbacks_periodic_check 
ON public.feedbacks(student_id, teacher_id, type, created_at) 
WHERE type = 'periodic_feedback';