import { Bell, Settings, Calendar, Trophy, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WeightChart } from "./WeightChart";
import { WeightInputModal } from "./WeightInputModal";
import { CoachAICard } from "./CoachAICard";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { QuickActions } from "./QuickActions";
import { DashboardStats } from "./DashboardStats";
import { StravaIntegrationCard } from "./StravaIntegrationCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useCurrentWorkoutSession } from "@/hooks/useCurrentWorkoutSession";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useWeightProgress } from "@/hooks/useWeightProgress";
import { useProgressActions } from "@/components/progress/ProgressActions";
import { useWeeklyFeedback } from "@/hooks/useWeeklyFeedback";
import { WeeklyFeedbackModal } from "@/components/feedback/WeeklyFeedbackModal";

interface DashboardProps {
  onCoachClick?: () => void;
  onWorkoutClick?: () => void;
}

export const Dashboard = ({ onCoachClick, onWorkoutClick }: DashboardProps) => {
  const { userProfile, user, isAuthenticated } = useAuthContext();
  const progressActions = useProgressActions();
  const { logWeight } = progressActions;
  const navigate = useNavigate();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const { addWeightEntry, shouldShowWeightModal, error: weightError, clearError } = useWeightProgress(user?.id || '');
  
  // Weekly feedback hook
  const { 
    shouldShowModal: shouldShowFeedbackModal, 
    setShouldShowModal: setShouldShowFeedbackModal, 
    submitWeeklyFeedback, 
    loading: feedbackLoading,
    feedbackSettings 
  } = useWeeklyFeedback();
  
  const rawName = userProfile?.name || (user?.user_metadata as any)?.name || '';
  const firstName = typeof rawName === 'string' && rawName.trim() && !rawName.includes('@') 
    ? rawName.split(' ')[0] 
    : 'Usuário';
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Check if should show weight modal (only on Fridays)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Show modal only on Fridays if user hasn't weighed this week
    const checkWeightModal = async () => {
      const shouldShow = await shouldShowWeightModal();
      if (shouldShow) {
        setTimeout(() => setShowWeightModal(true), 2000);
      }
    };
    
    checkWeightModal();
  }, [isAuthenticated, user, shouldShowWeightModal]);

  // Check if should show feedback modal (after weight modal logic)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Show feedback modal with delay if needed (after weight modal would show)
    if (shouldShowFeedbackModal) {
      const delay = shouldShowWeightModal ? 4000 : 2000; // Wait longer if weight modal is also showing
      setTimeout(() => setShouldShowFeedbackModal(true), delay);
    }
  }, [isAuthenticated, user, shouldShowFeedbackModal, shouldShowWeightModal]);

  const handleSaveWeight = async (weight: number) => {
    console.log('💾 Dashboard: Saving weight:', weight);
    
    // Use the weight progress system which now includes validation and gamification
    const success = await addWeightEntry(weight);
    console.log('✅ Dashboard: Weight save result:', success);
    
    if (success) {
      setShowWeightModal(false);
    }
    
    return success;
  };

  if (!isAuthenticated) {
    return null; // Enquanto redireciona
  }
  
  // Fetch current workout session
  const { currentSession, loading: workoutSessionLoading, hasWorkoutPlan } = useCurrentWorkoutSession();
  // const { progress, loading: progressLoading } = useProgress(user?.id || '');
  const progress: any[] = [];
  const progressLoading = false;
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Logo Header */}
      <div className="mb-4 text-center">
        <img 
          src="/lovable-uploads/2133926f-121d-45ce-8cff-80c84a1a0856.png" 
          alt="Shape Pro Logo" 
          className="w-20 h-auto mx-auto opacity-60"
        />
      </div>

      {/* Header with Date and Profile */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} className="text-warning" />
          {currentDate}
        </div>
        
        {user && <NotificationCenter userId={user.id} />}
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            Olá, <span className="text-gradient-primary">{firstName}!</span>
          </h1>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mb-6 text-center">
        <p className="text-foreground">
          Estou aqui para te guiar, vamos começar?
        </p>
      </div>


      {/* Weight Progress Chart */}
      <WeightChart onWeightNeeded={() => setShowWeightModal(true)} />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CoachAICard onCoachClick={onCoachClick} />
        <StravaIntegrationCard />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Announcement Banner - Positioned between agenda/meta and stats */}
      <AnnouncementBanner />

      {/* Stats Overview */}
      <DashboardStats 
        workouts={currentSession ? [{ name: currentSession.sessionName }] : []} 
        progress={progress} 
        loading={workoutSessionLoading || progressLoading} 
      />


      {hasWorkoutPlan && currentSession && (
        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Treino de Hoje</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {currentSession.sessionLabel}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sessão</span>
              <span className="text-sm font-medium text-foreground">
                {currentSession.sessionName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duração estimada</span>
              <span className="text-sm font-medium text-foreground">
                {currentSession.estimatedDuration > 0 ? `${Math.round(currentSession.estimatedDuration)} min` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exercícios</span>
              <span className="text-sm font-medium text-foreground">
                {currentSession.totalExercises} exercícios
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dificuldade</span>
              <span className="text-sm font-medium text-muted-foreground">
                {currentSession.difficulty}
              </span>
            </div>
          </div>
          
          <button onClick={onWorkoutClick} className="btn-primary w-full mt-4">
            Iniciar {currentSession.sessionLabel}
          </button>
        </div>
      )}

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={showWeightModal}
        onClose={() => {
          clearError();
          setShowWeightModal(false);
        }}
        onSave={handleSaveWeight}
        error={weightError}
      />

      {/* Weekly Feedback Modal */}
      <WeeklyFeedbackModal
        isOpen={shouldShowFeedbackModal}
        onClose={() => setShouldShowFeedbackModal(false)}
        onSubmit={submitWeeklyFeedback}
        loading={feedbackLoading}
        customQuestions={feedbackSettings?.custom_questions || []}
        feedbackFrequency={
          feedbackSettings?.feedback_frequency === 'daily' ? 'diário' :
          feedbackSettings?.feedback_frequency === 'weekly' ? 'semanal' :
          feedbackSettings?.feedback_frequency === 'biweekly' ? 'quinzenal' :
          feedbackSettings?.feedback_frequency === 'monthly' ? 'mensal' :
          'periódico'
        }
      />
    </div>
  );
};