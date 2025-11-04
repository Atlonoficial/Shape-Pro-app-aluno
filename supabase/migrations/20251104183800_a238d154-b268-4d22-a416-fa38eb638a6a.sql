-- Copiar credenciais do system_payment_config para teacher_payment_settings
-- A constraint verifica 'api_key', então vamos copiar access_token como api_key
UPDATE teacher_payment_settings
SET 
  is_active = true,
  credentials = jsonb_build_object(
    'api_key', (SELECT credentials->>'access_token' FROM system_payment_config WHERE gateway_type = 'mercadopago' AND is_active = true LIMIT 1),
    'access_token', (SELECT credentials->>'access_token' FROM system_payment_config WHERE gateway_type = 'mercadopago' AND is_active = true LIMIT 1),
    'public_key', (SELECT credentials->>'public_key' FROM system_payment_config WHERE gateway_type = 'mercadopago' AND is_active = true LIMIT 1),
    'is_sandbox', (SELECT (credentials->>'is_sandbox')::boolean FROM system_payment_config WHERE gateway_type = 'mercadopago' AND is_active = true LIMIT 1)
  ),
  updated_at = now()
WHERE teacher_id = '2db424b4-08d2-4ad0-9dd0-971eaab960e1';
