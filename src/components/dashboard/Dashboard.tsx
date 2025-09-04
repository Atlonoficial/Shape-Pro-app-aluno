import { Bell, Settings, Calendar, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WeightChart } from "./WeightChart";
import { WeightInputModal } from "./WeightInputModal";
import { CoachAICard } from "./CoachAICard";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { QuickActions } from "./QuickActions";
import { DashboardStats } from "./DashboardStats";
import { MetricCard } from "@/components/ui/MetricCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useWorkouts, useNotifications } from "@/hooks/useSupabase";
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
  const { shouldShowModal: shouldShowFeedbackModal, setShouldShowModal: setShouldShowFeedbackModal, submitWeeklyFeedback, loading: feedbackLoading } = useWeeklyFeedback();
  
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
  
  // Fetch real data from Supabase
  const { workouts, loading: workoutsLoading } = useWorkouts(user?.id || '');
  // const { progress, loading: progressLoading } = useProgress(user?.id || '');
  const progress: any[] = [];
  const progressLoading = false;
  const { notifications, loading: notificationsLoading } = useNotifications(user?.id || '');
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
        
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Bell size={20} className="text-primary" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
                  1
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Notificações</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 border-b border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Novo treino disponível!</p>
                      <p className="text-xs text-muted-foreground mt-1">Seu treino de peito e tríceps está pronto para hoje.</p>
                      <span className="text-xs text-muted-foreground">Há 2 horas</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-b border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Meta de peso atingida!</p>
                      <p className="text-xs text-muted-foreground mt-1">Parabéns! Você atingiu sua meta semanal de peso.</p>
                      <span className="text-xs text-muted-foreground">Ontem</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Lembrete de refeição</p>
                      <p className="text-xs text-muted-foreground mt-1">Não se esqueça de registrar sua refeição pós-treino.</p>
                      <span className="text-xs text-muted-foreground">2 dias atrás</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-border">
                <button className="text-xs text-primary hover:text-primary/80 transition-colors w-full text-center">
                  Ver todas as notificações
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <div>
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

      {/* Coach AI Card */}
      <CoachAICard onCoachClick={onCoachClick} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Announcement Banner - Positioned between agenda/meta and stats */}
      <AnnouncementBanner />

      {/* Stats Overview */}
      <DashboardStats 
        workouts={workouts} 
        progress={progress} 
        loading={workoutsLoading || progressLoading} 
      />


      {workouts && workouts.length > 0 && (
        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Treino de Hoje</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {workouts[0]?.name || 'Treino'}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duração estimada</span>
              <span className="text-sm font-medium text-foreground">
                {workouts[0]?.estimated_duration ? `${workouts[0].estimated_duration} min` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exercícios</span>
              <span className="text-sm font-medium text-foreground">
                {Array.isArray(workouts[0]?.exercises) ? `${workouts[0].exercises.length} exercícios` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dificuldade</span>
              <span className="text-sm font-medium text-muted-foreground">
                {workouts[0]?.difficulty || '-'}
              </span>
            </div>
          </div>
          
          <button onClick={onWorkoutClick} className="btn-primary w-full mt-4">
            Iniciar Treino
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
      />
    </div>
  );
};