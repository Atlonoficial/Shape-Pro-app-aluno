import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useToast } from '@/hooks/use-toast';

export interface WeeklyFeedbackData {
  training_rating: number;
  diet_rating: number;
  general_feedback: string;
  training_feedback?: string;
  diet_feedback?: string;
  questions?: string;
}

export const useWeeklyFeedback = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, teacherId } = useActiveSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  // Check if should show feedback modal
  const checkShouldShowFeedbackModal = async (): Promise<boolean> => {
    if (!user?.id || !hasActiveSubscription || !teacherId) return false;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
    
    // Only show on Fridays
    if (dayOfWeek !== 5) return false;

    try {
      // Get start and end of current week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      // Check if user already sent feedback this week
      const { data: existingFeedback, error } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('student_id', user.id)
        .eq('teacher_id', teacherId)
        .eq('type', 'weekly_feedback')
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing feedback:', error);
        return false;
      }

      // If feedback already exists this week, don't show modal
      return !existingFeedback;
    } catch (error) {
      console.error('Error checking feedback modal:', error);
      return false;
    }
  };

  // Submit weekly feedback
  const submitWeeklyFeedback = async (feedbackData: WeeklyFeedbackData): Promise<boolean> => {
    if (!user?.id || !teacherId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert({
          student_id: user.id,
          teacher_id: teacherId,
          type: 'weekly_feedback',
          rating: Math.round((feedbackData.training_rating + feedbackData.diet_rating) / 2),
          message: feedbackData.general_feedback,
          related_item_id: `week_${new Date().getFullYear()}_${getWeekNumber(new Date())}`,
          metadata: {
            training_rating: feedbackData.training_rating,
            diet_rating: feedbackData.diet_rating,
            training_feedback: feedbackData.training_feedback,
            diet_feedback: feedbackData.diet_feedback,
            questions: feedbackData.questions,
            week: getWeekNumber(new Date()),
            year: new Date().getFullYear()
          }
        });

      if (error) throw error;

      toast({
        title: "Feedback enviado!",
        description: "Seu feedback semanal foi enviado ao professor com sucesso.",
      });

      // Award points for feedback submission
      try {
        await supabase.rpc('award_points_enhanced_v3', {
          p_user_id: user.id,
          p_activity_type: 'weekly_feedback',
          p_description: 'Feedback semanal enviado',
          p_metadata: { week: getWeekNumber(new Date()), year: new Date().getFullYear() }
        });
      } catch (pointsError) {
        console.warn('Error awarding points for feedback:', pointsError);
      }

      return true;
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Ocorreu um erro ao enviar seu feedback. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get week number of year
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Get feedback history for current user
  const getFeedbackHistory = async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          id,
          rating,
          message,
          created_at,
          type,
          related_item_id,
          metadata
        `)
        .eq('student_id', user.id)
        .eq('type', 'weekly_feedback')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      return [];
    }
  };

  // Check on component mount and when dependencies change
  useEffect(() => {
    const checkModal = async () => {
      const shouldShow = await checkShouldShowFeedbackModal();
      setShouldShowModal(shouldShow);
    };

    if (hasActiveSubscription && teacherId) {
      checkModal();
    }
  }, [user?.id, hasActiveSubscription, teacherId]);

  return {
    shouldShowModal,
    setShouldShowModal,
    submitWeeklyFeedback,
    getFeedbackHistory,
    loading,
    hasActiveSubscription,
    teacherId
  };
};