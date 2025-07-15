import { MetricCard } from "../ui/MetricCard";
import { ProgressRing } from "../ui/ProgressRing";
import { Flame, Target, Trophy, Zap } from "lucide-react";

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <MetricCard
        title="Calorias Queimadas"
        value="340"
        subtitle="+12% hoje"
        icon={<Flame size={20} />}
        trend="up"
      />
      
      <MetricCard
        title="Treinos Concluídos"
        value="23"
        subtitle="Este mês"
        icon={<Target size={20} />}
        trend="up"
      />
      
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Meta Diária</span>
          <Trophy size={20} className="text-primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <ProgressRing progress={75} size={50} strokeWidth={4} color="primary">
            <span className="text-xs font-bold text-primary">75%</span>
          </ProgressRing>
          
          <div>
            <p className="text-lg font-bold text-foreground">3/4</p>
            <p className="text-xs text-muted-foreground">Objetivos</p>
          </div>
        </div>
      </div>
      
      <MetricCard
        title="Pontos XP"
        value="1,250"
        subtitle="+85 hoje"
        icon={<Zap size={20} />}
        trend="up"
      />
    </div>
  );
};