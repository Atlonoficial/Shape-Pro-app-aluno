import { Bell, Settings } from "lucide-react";
import { WeightChart } from "./WeightChart";
import { CoachAICard } from "./CoachAICard";
import { QuickActions } from "./QuickActions";
import { DashboardStats } from "./DashboardStats";

interface DashboardProps {
  onCoachClick?: () => void;
}

export const Dashboard = ({ onCoachClick }: DashboardProps) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Header with Date and Profile */}
      <div className="flex items-start justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          📅 {currentDate}
        </div>
        
        <div className="relative">
          <button className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors">
            <Bell size={20} className="text-primary" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
              1
            </span>
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Olá, <span className="text-gradient-primary">Alex!</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-warning/10 text-warning px-2 py-1 rounded-full text-xs font-medium">
              👑 Gold Fit
            </span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
              ⭐ Pro
            </span>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mb-6 text-center">
        <p className="text-foreground">
          Estou aqui para te guiar, vamos começar?
        </p>
      </div>

      {/* Weight Progress Chart */}
      <WeightChart />

      {/* Coach AI Card */}
      <CoachAICard onCoachClick={onCoachClick} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Overview */}
      <DashboardStats />

      {/* Today's Workout Preview */}
      <div className="card-gradient p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Treino de Hoje</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            PEITO & TRÍCEPS
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duração estimada</span>
            <span className="text-sm font-medium text-foreground">45 min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Exercícios</span>
            <span className="text-sm font-medium text-foreground">8 exercícios</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dificuldade</span>
            <span className="text-sm font-medium text-warning">Intermediário</span>
          </div>
        </div>
        
        <button className="btn-primary w-full mt-4">
          Iniciar Treino
        </button>
      </div>
    </div>
  );
};