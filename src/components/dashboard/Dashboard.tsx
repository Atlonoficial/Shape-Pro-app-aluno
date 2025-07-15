import { Bell, Settings } from "lucide-react";
import { WeightChart } from "./WeightChart";
import { CoachAICard } from "./CoachAICard";
import { QuickActions } from "./QuickActions";
import { DashboardStats } from "./DashboardStats";

export const Dashboard = () => {
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 12) return "Bom dia";
    if (currentHour < 18) return "Boa tarde"; 
    return "Boa noite";
  };

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, <span className="text-gradient-primary">Alex!</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Pronto para mais um dia de evolução?
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
            <Bell size={20} className="text-muted-foreground" />
          </button>
          <button className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
            <Settings size={20} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Weight Progress Chart */}
      <WeightChart />

      {/* Coach AI Card */}
      <CoachAICard />

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