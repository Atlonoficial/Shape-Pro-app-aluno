import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useToast } from '@/hooks/use-toast';

interface FeedbackSettings {
  feedback_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  feedback_days: number[];
  custom_questions: any[];
  is_active: boolean;
}

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
  const [feedbackSettings, setFeedbackSettings] = useState<FeedbackSettings | null>(null);

  // Fetch teacher's feedback settings
  const fetchFeedbackSettings = async (): Promise<FeedbackSettings | null> => {
    if (!teacherId) return null;

    try {
      const { data, error } = await supabase
        .from('teacher_feedback_settings')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching feedback settings:', error);
        return null;
      }

      // Return settings or default values
      return data ? {
        feedback_frequency: data.feedback_frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
        feedback_days: data.feedback_days,
        custom_questions: (data.custom_questions as any[]) || [],
        is_active: data.is_active,
      } : {
        feedback_frequency: 'weekly' as const,
        feedback_days: [5], // Friday
        custom_questions: [],
        is_active: true,
      };
    } catch (error) {
      console.error('Error fetching feedback settings:', error);
      return null;
    }
  };

  // Calculate next feedback date based on frequency
  const getNextFeedbackDate = (frequency: string, lastFeedbackDate?: Date): Date => {
    const base = lastFeedbackDate || new Date();
    const result = new Date(base);

    switch (frequency) {
      case 'daily':
        result.setDate(result.getDate() + 1);
        break;
      case 'weekly':
        result.setDate(result.getDate() + 7);
        break;
      case 'biweekly':
        result.setDate(result.getDate() + 14);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + 1);
        break;
      default:
        result.setDate(result.getDate() + 7);
    }

    return result;
  };

  // Check if should show feedback modal
  const checkShouldShowFeedbackModal = async (): Promise<boolean> => {
    if (!user?.id || !hasActiveSubscription || !teacherId) return false;

    // Fetch teacher's feedback settings
    const settings = await fetchFeedbackSettings();
    if (!settings || !settings.is_active) return false;

    setFeedbackSettings(settings);

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if today is one of the configured feedback days
    if (!settings.feedback_days.includes(dayOfWeek)) return false;

    try {
      // Calculate time range based on frequency
      let startDate: Date, endDate: Date;
      
      switch (settings.feedback_frequency) {
        case 'daily':
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay()); // Go to Sunday
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6); // Go to Saturday
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'biweekly':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 14);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        default:
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
      }

      // Check if user already sent feedback in this period
      const { data: existingFeedback, error } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('student_id', user.id)
        .eq('teacher_id', teacherId)
        .eq('type', 'periodic_feedback')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing feedback:', error);
        return false;
      }

      // If feedback already exists in this period, don't show modal
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
          type: 'periodic_feedback',
          rating: Math.round((feedbackData.training_rating + feedbackData.diet_rating) / 2),
          message: feedbackData.general_feedback,
          related_item_id: `${feedbackSettings?.feedback_frequency}_${new Date().getFullYear()}_${getWeekNumber(new Date())}`,
          metadata: {
            training_rating: feedbackData.training_rating,
            diet_rating: feedbackData.diet_rating,
            training_feedback: feedbackData.training_feedback,
            diet_feedback: feedbackData.diet_feedback,
            questions: feedbackData.questions,
            custom_responses: feedbackData.custom_responses || {},
            frequency: feedbackSettings?.feedback_frequency,
            week: getWeekNumber(new Date()),
            year: new Date().getFullYear()
          }
        });

      if (error) throw error;

      toast({
        title: "Feedback enviado!",
        description: "Seu feedback foi enviado ao professor com sucesso.",
      });

      // Award points for feedback submission
      try {
        await supabase.rpc('award_points_enhanced_v3', {
          p_user_id: user.id,
          p_activity_type: 'periodic_feedback',
          p_description: 'Feedback enviado',
          p_metadata: { 
            frequency: feedbackSettings?.feedback_frequency,
            week: getWeekNumber(new Date()), 
            year: new Date().getFullYear() 
          }
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
        .eq('type', 'periodic_feedback')
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
    teacherId,
    feedbackSettings
  };
};