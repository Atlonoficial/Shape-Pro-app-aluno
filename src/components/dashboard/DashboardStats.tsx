import { MetricCard } from "../ui/MetricCard";
import { ProgressRing } from "../ui/ProgressRing";
import { Flame, Target, Trophy, Zap } from "lucide-react";

interface DashboardStatsProps {
  workouts: any[];
  progress: any[];
  loading?: boolean;
}

export const DashboardStats = ({ workouts, progress, loading }: DashboardStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-6 bg-muted rounded mb-1"></div>
            <div className="h-3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calcular estatísticas reais dos dados do Firebase
  const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
  const thisMonthWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.completedAt || w.createdAt);
    const now = new Date();
    return workoutDate.getMonth() === now.getMonth() && workoutDate.getFullYear() === now.getFullYear();
  }).length;
  
  const latestWeight = progress.length > 0 ? progress[progress.length - 1].weight : 0;
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const todayCalories = workouts.filter(w => {
    const workoutDate = new Date(w.completedAt || w.createdAt);
    const today = new Date();
    return workoutDate.toDateString() === today.toDateString();
  }).reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  
  const totalXP = workouts.reduce((sum, w) => sum + (w.xpEarned || 0), 0);
  const todayXP = workouts.filter(w => {
    const workoutDate = new Date(w.completedAt || w.createdAt);
    const today = new Date();
    return workoutDate.toDateString() === today.toDateString();
  }).reduce((sum, w) => sum + (w.xpEarned || 0), 0);

  // Calcular meta diária (exemplo: 4 objetivos por dia)
  const dailyGoals = 4;
  const completedGoals = Math.min(dailyGoals, todayCalories > 0 ? 1 : 0 + thisMonthWorkouts > 0 ? 1 : 0 + 2);
  const goalProgress = Math.round((completedGoals / dailyGoals) * 100);
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <MetricCard
        title="Calorias Queimadas"
        value={todayCalories.toString()}
        subtitle={`Total: ${totalCalories}`}
        icon={<Flame size={20} />}
        trend={todayCalories > 0 ? "up" : "neutral"}
      />
      
      <MetricCard
        title="Treinos Concluídos"
        value={thisMonthWorkouts.toString()}
        subtitle="Este mês"
        icon={<Target size={20} />}
        trend={thisMonthWorkouts > 0 ? "up" : "neutral"}
      />
      
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Meta Diária</span>
          <Trophy size={20} className="text-primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <ProgressRing progress={goalProgress} size={50} strokeWidth={4} color="primary">
            <span className="text-xs font-bold text-primary">{goalProgress}%</span>
          </ProgressRing>
          
          <div>
            <p className="text-lg font-bold text-foreground">{completedGoals}/{dailyGoals}</p>
            <p className="text-xs text-muted-foreground">Objetivos</p>
          </div>
        </div>
      </div>
      
      <MetricCard
        title="Pontos XP"
        value={totalXP.toString()}
        subtitle={`+${todayXP} hoje`}
        icon={<Zap size={20} />}
        trend={todayXP > 0 ? "up" : "neutral"}
      />
    </div>
  );
};