import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useToast } from '@/hooks/use-toast';
import { showPointsToast } from '@/components/gamification/PointsToast';

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

  // Enhanced verification using direct student table check as fallback
  const verifyStudentStatus = async (): Promise<{ isActive: boolean; teacherId: string | null }> => {
    if (!user?.id) {
      console.log('[Feedback] No user ID available');
      return { isActive: false, teacherId: null };
    }

    try {
      console.log('[Feedback] Verifying student status for user:', user.id);
      
      // Direct check in students table for most reliable verification
      const { data: studentData, error } = await supabase
        .from('students')
        .select('teacher_id, membership_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Feedback] Error checking student status:', error);
        return { isActive: false, teacherId: null };
      }

      if (!studentData) {
        console.log('[Feedback] No student record found');
        return { isActive: false, teacherId: null };
      }

      const isActive = studentData.membership_status === 'active' || studentData.membership_status === 'free_trial';
      
      console.log('[Feedback] Student verification result:', {
        userId: user.id,
        teacherId: studentData.teacher_id,
        membershipStatus: studentData.membership_status,
        isActive,
        fallbackUsed: !hasActiveSubscription
      });

      return { 
        isActive, 
        teacherId: studentData.teacher_id 
      };
    } catch (error) {
      console.error('[Feedback] Error in student verification:', error);
      return { isActive: false, teacherId: null };
    }
  };

  // Fetch teacher's feedback settings with explicit teacher ID
  const fetchFeedbackSettingsForTeacher = async (targetTeacherId: string): Promise<FeedbackSettings | null> => {
    if (!targetTeacherId) return null;

    try {
      console.log('[Feedback] Fetching settings from DB for teacher:', targetTeacherId);
      const { data, error } = await supabase
        .from('teacher_feedback_settings')
        .select('*')
        .eq('teacher_id', targetTeacherId)
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

  // Check for missed feedback with enhanced teacher ID handling
  const checkMissedFeedback = async (settings: FeedbackSettings, targetTeacherId: string): Promise<boolean> => {
    if (!user?.id || !targetTeacherId) return false;

    try {
      console.log('[Feedback] 🔍 Checking missed feedback for:', { userId: user.id, targetTeacherId });

      const { data: existingFeedback, error } = await supabase
        .from('feedbacks')
        .select('id, created_at, metadata')
        .eq('student_id', user.id)
        .eq('teacher_id', targetTeacherId)
        .eq('type', 'periodic_feedback')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[Feedback] Error checking missed feedback:', error);
        return false;
      }

      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
      const expectedDay = settings.feedback_days?.[0] || 5; // Default Friday
      
      console.log('[Feedback] 📅 Current state:', {
        hasExistingFeedback: !!existingFeedback,
        today: today.toISOString(),
        dayOfWeek,
        expectedDay,
        frequency: settings.feedback_frequency
      });

      // CASE 1: First feedback ever
      if (!existingFeedback) {
        console.log('[Feedback] 🎯 FIRST FEEDBACK DETECTED');
        
        // If it's the expected day (e.g., Friday) → show modal
        if (dayOfWeek === expectedDay) {
          console.log('[Feedback] ✅ First feedback on expected day → SHOW MODAL');
          return true;
        }
        
        // If it's past the expected day → show modal (missed first feedback)
        if (settings.feedback_frequency === 'weekly') {
          // For weekly: if it's weekend or early next week, show modal
          if (dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1) { // Saturday, Sunday, Monday
            console.log('[Feedback] ✅ First feedback missed (weekend/Monday) → SHOW MODAL');
            return true;
          }
        }
        
        console.log('[Feedback] ⏳ First feedback not yet due');
        return false;
      }

      // CASE 2: Has previous feedback, check if current period is missed
      const lastFeedbackDate = new Date(existingFeedback.created_at);
      const daysSinceLastFeedback = Math.floor((today.getTime() - lastFeedbackDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log('[Feedback] 📝 Previous feedback found:', {
        lastFeedbackDate: lastFeedbackDate.toISOString(),
        daysSinceLastFeedback
      });

      // Check if feedback was missed based on frequency
      let feedbackWasMissed = false;

      switch (settings.feedback_frequency) {
        case 'weekly':
          // Usar verificação de semana ISO correta
          const getWeekNumber = (date: Date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
          };
          
          const currentWeek = getWeekNumber(today);
          const lastFeedbackWeek = getWeekNumber(lastFeedbackDate);
          const currentYear = today.getFullYear();
          const lastFeedbackYear = lastFeedbackDate.getFullYear();
          
          // Feedback foi perdido se não foi enviado nesta semana e é o dia esperado (ou passou)
          if (dayOfWeek === expectedDay) {
            feedbackWasMissed = !(currentWeek === lastFeedbackWeek && currentYear === lastFeedbackYear);
          }
          // Se passou do dia esperado na semana
          else if (dayOfWeek > expectedDay || (dayOfWeek < expectedDay && dayOfWeek <= 1)) {
            feedbackWasMissed = !(currentWeek === lastFeedbackWeek && currentYear === lastFeedbackYear);
          }
          break;
        case 'biweekly':
          feedbackWasMissed = daysSinceLastFeedback >= 14;
          break;
        case 'monthly':
          feedbackWasMissed = daysSinceLastFeedback >= 30;
          break;
        default:
          feedbackWasMissed = daysSinceLastFeedback >= 7;
      }

      console.log('[Feedback] 📊 Missed feedback analysis:', {
        feedbackWasMissed,
        frequency: settings.feedback_frequency,
        daysSinceLastFeedback
      });

      if (feedbackWasMissed) {
        console.log('[Feedback] ✅ Missed feedback detected → SHOW MODAL');
        return true;
      }

      console.log('[Feedback] ✅ No missed feedback');
      return false;
    } catch (error) {
      console.error('[Feedback] Error in missed feedback check:', error);
      return false;
    }
  };

  // Enhanced check for feedback modal with robust verification
  const checkShouldShowFeedbackModal = async (): Promise<boolean> => {
    console.log('[Feedback] === STARTING FEEDBACK MODAL CHECK ===');
    console.log('[Feedback] Initial state:', {
      userId: user?.id,
      hasActiveSubscription,
      teacherId,
      userExists: !!user?.id
    });

    if (!user?.id) {
      console.log('[Feedback] ❌ No user ID - aborting');
      return false;
    }

    // Use enhanced verification as primary method with fallback
    const studentStatus = await verifyStudentStatus();
    const finalTeacherId = teacherId || studentStatus.teacherId;
    const finalIsActive = hasActiveSubscription || studentStatus.isActive;

    console.log('[Feedback] Enhanced verification results:', {
      fromSubscriptionHook: { hasActiveSubscription, teacherId },
      fromDirectCheck: studentStatus,
      finalValues: { finalIsActive, finalTeacherId }
    });

    if (!finalIsActive || !finalTeacherId) {
      console.log('[Feedback] ❌ Requirements not met:', {
        isActive: finalIsActive,
        teacherId: finalTeacherId
      });
      return false;
    }

    try {
      // Fetch teacher's feedback settings using final teacher ID
      console.log('[Feedback] ✅ Fetching settings for teacher:', finalTeacherId);
      const settings = await Promise.race([
        fetchFeedbackSettingsForTeacher(finalTeacherId),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Settings fetch timeout')), 5000)
        )
      ]);
      
      if (!settings || !settings.is_active) {
        console.log('[Feedback] Settings not active or not found:', settings);
        return false;
      }

      setFeedbackSettings(settings);
      console.log('[Feedback] Settings loaded:', settings);

      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      
      // First, check if feedback was missed and needs rescheduling
      const isMissedFeedback = await checkMissedFeedback(settings, finalTeacherId);
      if (isMissedFeedback) {
        console.log('[Feedback] ✅ Showing rescheduled feedback modal');
        return true;
      }
      
      // Check if today is one of the configured feedback days
      console.log('[Feedback] 📅 Day check:', {
        today: dayOfWeek,
        configuredDays: settings.feedback_days,
        isConfiguredDay: settings.feedback_days.includes(dayOfWeek)
      });
      
      if (!settings.feedback_days.includes(dayOfWeek)) {
        console.log('[Feedback] ❌ Today is not a feedback day');
        return false;
      }

      // Check existing feedback using final teacher ID
      console.log('[Feedback] 🔍 Checking existing feedback...');
      const { data: existingFeedback, error } = await supabase
        .from('feedbacks')
        .select('id, created_at')
        .eq('student_id', user.id)
        .eq('teacher_id', finalTeacherId)
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
        
        // Check based on frequency - CORRIGIDO para não aparecer no mesmo período
        let shouldShow = false;
        switch (settings.feedback_frequency) {
          case 'daily':
            // Se foi enviado hoje, não mostrar novamente
            shouldShow = lastFeedbackDate.toDateString() !== today.toDateString();
            break;
          case 'weekly':
            // Se foi enviado nesta semana ISO, não mostrar novamente
            const getWeekNumber = (date: Date) => {
              const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
              const dayNum = d.getUTCDay() || 7;
              d.setUTCDate(d.getUTCDate() + 4 - dayNum);
              const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
              return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
            };
            const currentWeek = getWeekNumber(today);
            const lastFeedbackWeek = getWeekNumber(lastFeedbackDate);
            const currentYear = today.getFullYear();
            const lastFeedbackYear = lastFeedbackDate.getFullYear();
            shouldShow = !(currentWeek === lastFeedbackWeek && currentYear === lastFeedbackYear);
            break;
          case 'biweekly':
            const daysSinceBiweekly = Math.floor((today.getTime() - lastFeedbackDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldShow = daysSinceBiweekly >= 14;
            break;
          case 'monthly':
            // Se foi enviado neste mês, não mostrar novamente
            shouldShow = !(lastFeedbackDate.getMonth() === today.getMonth() && 
                          lastFeedbackDate.getFullYear() === today.getFullYear());
            break;
          default:
            const daysSinceDefault = Math.floor((today.getTime() - lastFeedbackDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldShow = daysSinceDefault >= 7;
        }

        console.log('[Feedback] Existing feedback check:', {
          lastFeedback: lastFeedbackDate,
          frequency: settings.feedback_frequency,
          shouldShow,
          sameDay: lastFeedbackDate.toDateString() === today.toDateString()
        });

        return shouldShow;
      }

      // No existing feedback - show modal
      console.log('[Feedback] ✅ No existing feedback found - showing modal');
      return true;

    } catch (error) {
      console.error('[Feedback] Error in modal check:', error);
      return false;
    }
  };

  // Submit weekly feedback with improved error handling
  const submitWeeklyFeedback = async (feedbackData: WeeklyFeedbackData): Promise<boolean> => {
    console.log('🎯 [DEBUG] Starting feedback submission with:', {
      userId: user?.id,
      teacherId,
      hasActiveSubscription,
      feedbackData: {
        overallRating: feedbackData.overallRating,
        trainingRating: feedbackData.trainingRating,
        dietRating: feedbackData.dietRating,
        hasGeneralFeedback: !!feedbackData.generalFeedback,
        hasCustomResponses: !!feedbackData.customResponses
      }
    });

    // ETAPA 1: Fallback robusto para buscar teacherId diretamente
    let finalTeacherId = teacherId;
    
    if (!finalTeacherId && user?.id) {
      console.log('🔄 [Feedback] Teacher ID not available from hook, fetching directly from students table...');
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .maybeSingle();
      
      if (studentError) {
        console.error('❌ [Feedback] Error fetching teacher_id from students:', studentError);
      } else {
        finalTeacherId = studentData?.teacher_id || null;
        console.log('✅ [Feedback] Direct fetch result:', {
          success: !!finalTeacherId,
          teacherId: finalTeacherId,
          fromFallback: true
        });
      }
    }

    if (!user?.id || !finalTeacherId) {
      console.error('❌ [DEBUG] Missing required IDs after fallback', { 
        userId: user?.id, 
        teacherId: finalTeacherId,
        fromHook: teacherId,
        fromFallback: finalTeacherId !== teacherId,
        fallbackUsed: !teacherId && !!finalTeacherId
      });
      toast({
        title: "Erro",
        description: "Não foi possível identificar seu professor. Tente novamente ou entre em contato com o suporte.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      console.log('✅ [DEBUG] Preparing RPC call with:', { 
        studentId: user.id, 
        teacherId,
        currentWeek: getWeekNumber(new Date()),
        currentYear: new Date().getFullYear()
      });

      // Usar função RPC corrigida v4 com logs detalhados
      console.log('📞 [DEBUG] Calling RPC submit_feedback_with_points_v4 with finalTeacherId...');
      const { data: result, error } = await supabase.rpc('submit_feedback_with_points_v4', {
        p_student_id: user.id,
        p_teacher_id: finalTeacherId,
        p_feedback_data: {
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

      console.log('📊 [DEBUG] RPC response received:', { 
        hasData: !!result, 
        hasError: !!error,
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error('❌ [DEBUG] RPC error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }

      console.log('✅ [DEBUG] RPC success! Result:', result);
      
      const resultData = result as any;
      console.log('🔍 [DEBUG] Analyzing result data:', {
        success: resultData?.success,
        duplicate: resultData?.duplicate,
        error_type: resultData?.error_type,
        message: resultData?.message,
        points_awarded: resultData?.points_awarded,
        last_feedback_date: resultData?.last_feedback_date
      });

      if (!resultData?.success) {
        const errorMessage = resultData?.message || 'Erro desconhecido ao enviar feedback';
        console.warn('⚠️ [DEBUG] Operation failed:', {
          duplicate: resultData?.duplicate,
          error_type: resultData?.error_type,
          message: errorMessage,
          fullData: resultData
        });
        
        if (resultData?.duplicate) {
          console.log('🔄 [DEBUG] Duplicate feedback detected');
          toast({
            title: "Feedback já enviado",
            description: errorMessage,
            variant: "destructive"
          });
          setShouldShowModal(false); // Hide modal if already sent
          return false;
        }

        if (resultData?.error_type === 'relationship_not_found' || resultData?.error_type === 'teacher_not_found') {
          toast({
            title: "Erro de validação",
            description: resultData?.message || "Relacionamento aluno-professor não encontrado.",
            variant: "destructive"
          });
          return false;
        }

        throw new Error(errorMessage);
      }

      // Sucesso - mostrar toast com pontos e fechar modal
      const pointsAwarded = resultData.points_awarded || 0;
      console.log('[Feedback] Success! Points awarded:', pointsAwarded);
      
      // Usar toast padrão do sistema de gamificação
      showPointsToast({
        points: pointsAwarded,
        activity: 'Feedback Enviado',
        description: 'Obrigado pelo seu feedback!'
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

  // Enhanced effect with retry mechanism and better timing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkModalWithRetry = async (retryCount = 0) => {
      console.log('[Feedback] Effect triggered, retry count:', retryCount);
      
      if (!user?.id) {
        console.log('[Feedback] No user, waiting...');
        return;
      }

      try {
        const shouldShow = await checkShouldShowFeedbackModal();
        console.log('[Feedback] Modal check result:', shouldShow);
        setShouldShowModal(shouldShow);
      } catch (error) {
        console.error('[Feedback] Error in modal check:', error);
        
        // Retry up to 3 times with increasing delay
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
          console.log(`[Feedback] Retrying in ${delay}ms...`);
          timeoutId = setTimeout(() => checkModalWithRetry(retryCount + 1), delay);
        }
      }
    };

    // Always try to check, don't depend on subscription hook state
    if (user?.id) {
      checkModalWithRetry();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id]); // Simplified dependency array

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