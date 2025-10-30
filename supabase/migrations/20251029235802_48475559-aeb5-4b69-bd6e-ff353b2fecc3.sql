-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para limpeza automática de conversas antigas
-- Executa todos os dias à meia-noite (00:00 UTC)
SELECT cron.schedule(
  'cleanup-old-ai-conversations',
  '0 0 * * *', -- Cron expression: todo dia às 00:00
  $$
  SELECT
    net.http_post(
      url := 'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/cleanup-old-conversations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm9wa3F6a2F2aG1lbmpsaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjEwMTQsImV4cCI6MjA3MDQ5NzAxNH0.AeqAVWHVqyAn7wxNvHeuQFkJREHUTB9fZP22qpv73d0"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Comentário descritivo
COMMENT ON EXTENSION pg_cron IS 'Sistema de agendamento de tarefas periódicas (cron jobs)';
COMMENT ON EXTENSION pg_net IS 'Extensão para fazer requisições HTTP do Postgres';
