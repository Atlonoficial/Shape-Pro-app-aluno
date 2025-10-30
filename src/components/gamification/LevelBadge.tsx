import { Badge } from "@/components/ui/badge";
import { Star, Crown, Trophy, Award, Gem, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  totalPoints: number;
  className?: string;
  showProgress?: boolean;
}

export const LevelBadge = ({ level, totalPoints, className, showProgress = false }: LevelBadgeProps) => {
  const getLevelInfo = (level: number) => {
    const levelConfigs = [
      { name: "Iniciante", icon: Star, color: "bg-muted text-muted-foreground", borderColor: "border-muted" },
      { name: "Bronze", icon: Trophy, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", borderColor: "border-orange-300" },
      { name: "Prata", icon: Award, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", borderColor: "border-gray-300" },
      { name: "Ouro", icon: Crown, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", borderColor: "border-yellow-300" },
      { name: "Platina", icon: Gem, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", borderColor: "border-blue-300" },
      { name: "Diamante", icon: Sparkles, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", borderColor: "border-purple-300" },
      { name: "Mestre", icon: Crown, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", borderColor: "border-red-300" },
      { name: "Lenda", icon: Sparkles, color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", borderColor: "border-gradient" }
    ];

    const config = levelConfigs[Math.min(level - 1, levelConfigs.length - 1)] || levelConfigs[0];
    return {
      ...config,
      displayName: level > levelConfigs.length ? `Nível ${level}` : config.name
    };
  };

  const levelInfo = getLevelInfo(level);
  const Icon = levelInfo.icon;

  // Calcular progresso se solicitado
  const getProgressInfo = () => {
    const currentLevelPoints = Math.pow(level - 1, 2) * 100;
    const nextLevelPoints = Math.pow(level, 2) * 100;
    const progressToNext = totalPoints - currentLevelPoints;
    const pointsNeeded = nextLevelPoints - currentLevelPoints;
    const progress = (progressToNext / pointsNeeded) * 100;

    return {
      progress: Math.min(progress, 100),
      progressToNext,
      pointsNeeded
    };
  };

  const progressInfo = showProgress ? getProgressInfo() : null;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <Badge 
        variant="outline" 
        className={cn(
          "px-3 py-1 font-medium border-2 transition-all",
          levelInfo.color,
          levelInfo.borderColor
        )}
      >
        <Icon className="w-4 h-4 mr-1" />
        {levelInfo.displayName}
      </Badge>
      
      {showProgress && progressInfo && (
        <div className="text-xs text-muted-foreground text-center">
          <div className="w-16 bg-muted/20 rounded-full h-1 mb-1">
            <div 
              className="h-1 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressInfo.progress}%` }}
            />
          </div>
          <span>{progressInfo.progressToNext}/{progressInfo.pointsNeeded}</span>
        </div>
      )}
    </div>
  );
};