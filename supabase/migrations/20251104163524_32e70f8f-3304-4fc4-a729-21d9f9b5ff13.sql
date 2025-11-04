-- Add gateway_preference_id column to payment_transactions
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS gateway_preference_id TEXT;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_preference_id 
ON payment_transactions(gateway_preference_id);

-- Add index for gateway_payment_id if not exists
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_payment_id 
ON payment_transactions(gateway_payment_id);

COMMENT ON COLUMN payment_transactions.gateway_preference_id IS 'ID da preferência/checkout criada no gateway (ex: Mercado Pago preference ID)';
COMMENT ON COLUMN payment_transactions.gateway_payment_id IS 'ID do pagamento confirmado no gateway';