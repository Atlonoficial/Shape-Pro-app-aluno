-- Adicionar campos para gerenciar cancelamento
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_by uuid,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;