-- Atualizar constraint da tabela gamification_activities para incluir meal_logged
ALTER TABLE public.gamification_activities 
DROP CONSTRAINT IF EXISTS gamification_activities_activity_type_check;

ALTER TABLE public.gamification_activities 
ADD CONSTRAINT gamification_activities_activity_type_check 
CHECK (activity_type IN (
  'training_completed',
  'daily_checkin', 
  'meal_logged',
  'progress_logged',
  'goal_achieved',
  'assessment_completed',
  'medical_exam_uploaded',
  'ai_interaction',
  'teacher_message',
  'appointment_attended',
  'streak_milestone',
  'achievement_earned',
  'reward_redeemed',
  'level_up'
));

-- Criar trigger para auto-award pontos quando refeições são logadas
CREATE OR REPLACE FUNCTION public.auto_award_meal_points()
RETURNS trigger AS $$
BEGIN
  -- Só dar pontos quando a refeição é marcada como consumida
  IF NEW.consumed = true AND (OLD IS NULL OR OLD.consumed = false) THEN
    PERFORM public.award_points_enhanced(
      NEW.user_id,
      'meal_logged',
      'Refeição registrada',
      jsonb_build_object('meal_id', NEW.meal_id, 'rating', NEW.rating)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela meal_logs
DROP TRIGGER IF EXISTS trigger_auto_award_meal_points ON public.meal_logs;
CREATE TRIGGER trigger_auto_award_meal_points
  AFTER INSERT OR UPDATE ON public.meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_meal_points();