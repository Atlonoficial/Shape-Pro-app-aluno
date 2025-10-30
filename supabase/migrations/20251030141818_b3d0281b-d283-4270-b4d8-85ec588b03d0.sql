-- Limpar transações pendentes antigas (mais de 7 dias)
UPDATE payment_transactions
SET 
  status = 'expired',
  updated_at = NOW()
WHERE 
  status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days';
