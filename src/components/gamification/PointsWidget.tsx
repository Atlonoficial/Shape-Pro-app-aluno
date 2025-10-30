import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent } from "@/components/ui/card";
import { PointsDisplay } from "./PointsDisplay";
import { LevelBadge } from "./LevelBadge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface PointsWidgetProps {
  onClick?: () => void;
  compact?: boolean;
}

export const PointsWidget = ({ onClick, compact = false }: PointsWidgetProps) => {
  const { userPoints, activities, loading, getLevelInfo } = useGamification();

  if (loading) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-muted/20 rounded mb-3" />
            <div className="h-4 bg-muted/20 rounded mb-2" />
            <div className="h-2 bg-muted/20 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const points = userPoints?.total_points || 0;
  const levelInfo = getLevelInfo(points);
  
  // Calcular pontos ganhos hoje
  const today = new Date().toISOString().split('T')[0];
  const todayPoints = activities
    .filter(activity => activity.created_at.startsWith(today))
    .reduce((sum, activity) => sum + activity.points_earned, 0);

  if (compact) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <PointsDisplay points={points} size="sm" />
            <div className="text-right">
              <LevelBadge level={levelInfo.level} totalPoints={points} />
              {todayPoints > 0 && (
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{todayPoints} hoje
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <PointsDisplay 
              points={points} 
              showTrend={todayPoints > 0}
              recentGain={todayPoints}
            />
            <LevelBadge level={levelInfo.level} totalPoints={points} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso para {levelInfo.name}</span>
              <span className="font-medium">{Math.round(levelInfo.progress)}%</span>
            </div>
            <Progress value={levelInfo.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {levelInfo.progressToNext} / {levelInfo.pointsNeeded} pontos para o próximo nível
            </p>
          </div>

          {userPoints?.current_streak && userPoints.current_streak > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                Sequência atual: <span className="font-medium text-foreground">{userPoints.current_streak} dias</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};