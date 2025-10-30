-- Atualizar todos os profiles existentes com push_enabled = true por padrão
-- Garantir que notification_preferences existe e tem o campo push_enabled
UPDATE profiles
SET notification_preferences = 
  CASE 
    WHEN notification_preferences IS NULL THEN '{"push_enabled": true}'::jsonb
    ELSE notification_preferences || '{"push_enabled": true}'::jsonb
  END
WHERE notification_preferences IS NULL 
   OR NOT (notification_preferences ? 'push_enabled');

-- Adicionar comentário explicativo na tabela
COMMENT ON COLUMN profiles.notification_preferences IS 'JSONB storing notification settings: push_enabled (boolean), workout_reminders (boolean), achievements (boolean), social (boolean)';