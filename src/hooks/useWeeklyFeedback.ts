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
  overallRating: number;
  trainingRating: number;
  dietRating: number;
  generalFeedback: string;
  trainingFeedback?: string;
  dietFeedback?: string;
  questions?: string;
  customResponses?: { [key: string]: any };
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

  // Optimized check for feedback modal with better error handling
  const checkShouldShowFeedbackModal = async (): Promise<boolean> => {
    if (!user?.id || !hasActiveSubscription || !teacherId) {
      console.log('[Feedback] Modal check skipped - missing requirements', {
        userId: !!user?.id,
        hasSubscription: hasActiveSubscription,
        teacherId: !!teacherId
      });
      return false;
    }

    try {
      // Fetch teacher's feedback settings with timeout
      console.log('[Feedback] Fetching settings for teacher:', teacherId);
      const settings = await fetchFeedbackSettings();
      
      if (!settings || !settings.is_active) {
        console.log('[Feedback] Settings not active or not found:', settings);
        return false;
      }

      setFeedbackSettings(settings);
      console.log('[Feedback] Settings loaded:', settings);

      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if today is one of the configured feedback days
      if (!settings.feedback_days.includes(dayOfWeek)) {
        console.log('[Feedback] Today is not a feedback day', {
          today: dayOfWeek,
          configuredDays: settings.feedback_days
        });
        return false;
      }

      // Simple period check - use database function logic
      const { data: existingFeedback, error } = await supabase
        .from('feedbacks')
        .select('id, created_at')
        .eq('student_id', user.id)
        .eq('teacher_id', teacherId)
        .eq('type', 'periodic_feedback')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[Feedback] Error checking existing feedback:', error);
        return false;
      }

      if (existingFeedback) {
        const lastFeedbackDate = new Date(existingFeedback.created_at);
        const today = new Date();
        
        // Check based on frequency
        let shouldShow = false;
        switch (settings.feedback_frequency) {
          case 'daily':
            shouldShow = lastFeedbackDate.toDateString() !== today.toDateString();
            break;
          case 'weekly':
            const daysSinceLastFeedback = Math.floor((today.getTime() - lastFeedbackDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldShow = daysSinceLastFeedback >= 7;
            break;
          case 'biweekly':
            const daysSinceBiweekly = Math.floor((today.getTime() - lastFeedbackDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldShow = daysSinceBiweekly >= 14;
            break;
          case 'monthly':
            shouldShow = lastFeedbackDate.getMonth() !== today.getMonth() || 
                        lastFeedbackDate.getFullYear() !== today.getFullYear();
            break;
          default:
            const daysSinceDefault = Math.floor((today.getTime() - lastFeedbackDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldShow = daysSinceDefault >= 7;
        }

        console.log('[Feedback] Existing feedback check:', {
          lastFeedback: lastFeedbackDate,
          frequency: settings.feedback_frequency,
          shouldShow
        });

        return shouldShow;
      }

      // No existing feedback - show modal
      console.log('[Feedback] No existing feedback found - showing modal');
      return true;

    } catch (error) {
      console.error('[Feedback] Error in modal check:', error);
      return false;
    }
  };

  // Submit weekly feedback with improved error handling
  const submitWeeklyFeedback = async (feedbackData: WeeklyFeedbackData): Promise<boolean> => {
    if (!user?.id || !teacherId) {
      console.error('[Feedback] User ID or Teacher ID not available', { userId: user?.id, teacherId });
      toast({
        title: "Erro",
        description: "Informações do usuário não disponíveis",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      console.log('[Feedback] Starting feedback submission', { 
        studentId: user.id, 
        teacherId, 
        feedbackData 
      });

      // Usar função RPC otimizada v2
      const { data: result, error } = await supabase.rpc('submit_feedback_with_points_v2', {
        p_student_id: user.id,
        p_teacher_id: teacherId,
        p_feedback_data: {
          type: 'periodic_feedback',
          rating: feedbackData.overallRating,
          message: feedbackData.generalFeedback || '',
          metadata: {
            week: getWeekNumber(new Date()),
            year: new Date().getFullYear(),
            training_rating: feedbackData.trainingRating,
            diet_rating: feedbackData.dietRating,
            training_feedback: feedbackData.trainingFeedback || '',
            diet_feedback: feedbackData.dietFeedback || '',
            questions: feedbackData.questions || '',
            custom_responses: feedbackData.customResponses || {},
            frequency: feedbackSettings?.feedback_frequency || 'weekly',
            submitted_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('[Feedback] RPC error:', error);
        throw error;
      }

      console.log('[Feedback] RPC result:', result);
      
      const resultData = result as any;
      if (!resultData?.success) {
        const errorMessage = resultData?.message || 'Erro desconhecido ao enviar feedback';
        console.warn('[Feedback] Operation failed:', resultData);
        
        if (resultData?.duplicate) {
          toast({
            title: "Feedback já enviado",
            description: errorMessage,
            variant: "destructive"
          });
          setShouldShowModal(false); // Hide modal if already sent
          return false;
        }

        if (resultData?.error_type === 'relationship') {
          toast({
            title: "Erro de validação",
            description: "Relacionamento aluno-professor não encontrado. Entre em contato com o suporte.",
            variant: "destructive"
          });
          return false;
        }

        throw new Error(errorMessage);
      }

      // Sucesso - mostrar toast com pontos e fechar modal
      const pointsAwarded = resultData.points_awarded || 0;
      console.log('[Feedback] Success! Points awarded:', pointsAwarded);
      
      toast({
        title: "Feedback enviado!",
        description: pointsAwarded > 0 
          ? `Obrigado pelo feedback! Você ganhou ${pointsAwarded} pontos.`
          : "Obrigado pelo seu feedback!",
        variant: "default"
      });

      setShouldShowModal(false);
      return true;

    } catch (error: any) {
      console.error('[Feedback] Submit error:', error);
      
      // Mensagens de erro mais específicas e amigáveis
      let errorMessage = "Erro interno. Tente novamente em alguns instantes.";
      let errorTitle = "Erro ao enviar feedback";
      
      if (error.message?.includes('relationship') || error.message?.includes('not found')) {
        errorMessage = "Relacionamento professor-aluno não encontrado. Verifique se você está vinculado corretamente.";
        errorTitle = "Erro de vinculação";
      } else if (error.message?.includes('duplicate') || error.message?.includes('já enviado')) {
        errorMessage = "Feedback já enviado neste período. Aguarde o próximo ciclo.";
        errorTitle = "Feedback duplicado";
      } else if (error.message?.includes('violates') || error.message?.includes('constraint')) {
        errorMessage = "Dados inválidos. Verifique se todas as informações estão corretas.";
        errorTitle = "Dados inválidos";
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        errorMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
        errorTitle = "Erro de conexão";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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