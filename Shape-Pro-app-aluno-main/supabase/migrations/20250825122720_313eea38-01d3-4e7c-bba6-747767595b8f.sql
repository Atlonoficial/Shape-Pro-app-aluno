-- Remove triggers duplicados que estão causando triplicação de pontos
DROP TRIGGER IF EXISTS trigger_auto_award_meal_points ON meal_logs;
DROP TRIGGER IF EXISTS trigger_award_meal_points ON meal_logs;

-- Verificar se há triggers duplicados em outras tabelas
DROP TRIGGER IF EXISTS trigger_auto_award_workout_points ON workouts;
DROP TRIGGER IF EXISTS trigger_award_workout_points ON workouts;
DROP TRIGGER IF EXISTS trigger_auto_award_progress_points ON progress;
DROP TRIGGER IF EXISTS trigger_award_progress_points ON progress;

-- Manter apenas os triggers principais
-- auto_award_meal_points_trigger (já existe e deve ser mantido)
-- auto_award_workout_points_trigger (verificar se existe)
-- auto_award_progress_points_trigger (verificar se existe)

-- Criar trigger de workout se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'auto_award_workout_points_trigger'
        AND event_object_table = 'workouts'
    ) THEN
        CREATE TRIGGER auto_award_workout_points_trigger
            AFTER UPDATE ON workouts
            FOR EACH ROW
            EXECUTE FUNCTION auto_award_workout_points();
    END IF;
END$$;

-- Criar trigger de progress se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'auto_award_progress_points_trigger'
        AND event_object_table = 'progress'
    ) THEN
        CREATE TRIGGER auto_award_progress_points_trigger
            AFTER INSERT ON progress
            FOR EACH ROW
            EXECUTE FUNCTION auto_award_progress_points();
    END IF;
END$$;

-- Limpar atividades duplicadas (manter apenas a mais recente de cada tipo por usuário por dia)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, activity_type, DATE(created_at), metadata 
            ORDER BY created_at DESC
        ) as rn
    FROM gamification_activities
    WHERE activity_type IN ('meal_logged', 'training_completed', 'progress_logged')
    AND created_at >= CURRENT_DATE - INTERVAL '30 days' -- Últimos 30 dias apenas
)
DELETE FROM gamification_activities 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Recalcular pontos totais dos usuários
UPDATE user_points 
SET total_points = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM gamification_activities 
    WHERE gamification_activities.user_id = user_points.user_id
),
level = calculate_user_level((
    SELECT COALESCE(SUM(points_earned), 0)
    FROM gamification_activities 
    WHERE gamification_activities.user_id = user_points.user_id
)),
updated_at = now();

-- Atualizar rankings mensais
SELECT update_monthly_rankings();