-- Primeiro, remover a constraint existente e criar uma nova que permita 'mercadopago'
ALTER TABLE teacher_payment_settings 
DROP CONSTRAINT IF EXISTS teacher_payment_settings_gateway_type_check;

-- Adicionar nova constraint que inclui 'mercadopago'
ALTER TABLE teacher_payment_settings 
ADD CONSTRAINT teacher_payment_settings_gateway_type_check 
CHECK (gateway_type IN ('mercadopago', 'mercado_pago', 'stripe', 'pagseguro', 'asaas'));

-- Agora atualizar os registros existentes
UPDATE teacher_payment_settings 
SET gateway_type = 'mercadopago' 
WHERE gateway_type = 'mercado_pago';