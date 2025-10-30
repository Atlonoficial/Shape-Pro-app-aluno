-- Ativar triggers automáticos para gamificação

-- 1. Trigger para meal_logs (se não existe)
CREATE OR REPLACE TRIGGER trigger_auto_award_meal_points
    AFTER INSERT OR UPDATE ON public.meal_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_award_meal_points();

-- 2. Trigger para workout_sessions (se não existe)
CREATE OR REPLACE TRIGGER trigger_auto_award_workout_points
    AFTER INSERT OR UPDATE ON public.workout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_award_workout_points();

-- 3. Trigger para gamification_activities (verificar conquistas)
CREATE OR REPLACE TRIGGER trigger_check_achievements_after_activity
    AFTER INSERT ON public.gamification_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_achievements();

-- 4. Adicionar streak tracking à tabela user_points se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_points' AND column_name = 'current_streak') THEN
        ALTER TABLE public.user_points ADD COLUMN current_streak INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_points' AND column_name = 'longest_streak') THEN
        ALTER TABLE public.user_points ADD COLUMN longest_streak INTEGER DEFAULT 0;
    END IF;
END $$;