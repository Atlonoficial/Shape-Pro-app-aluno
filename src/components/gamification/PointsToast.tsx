import { toast } from "sonner";
import { Trophy, Star, Award, Target } from "lucide-react";

interface PointsToastProps {
  points: number;
  activity: string;
  description?: string;
  level?: number;
  isLevelUp?: boolean;
}

export const showPointsToast = ({ 
  points, 
  activity, 
  description, 
  level, 
  isLevelUp 
}: PointsToastProps) => {
  const getIcon = () => {
    if (isLevelUp) return Award;
    if (points >= 100) return Trophy;
    if (points >= 50) return Star;
    return Target;
  };

  const getColor = () => {
    if (isLevelUp) return "text-warning";
    if (points >= 100) return "text-success";
    if (points >= 50) return "text-accent";
    return "text-primary";
  };

  const Icon = getIcon();

  toast.custom((t) => (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg min-w-[320px]">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${getColor()}`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg text-foreground">+{points}</span>
            <span className="text-sm text-muted-foreground">pontos</span>
            {isLevelUp && (
              <div className="px-2 py-1 bg-warning/20 rounded-full">
                <span className="text-xs font-bold text-warning">NÍVEL {level}!</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-foreground font-medium mb-1">
            {activity}
          </div>
          
          {description && (
            <div className="text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  ), {
    duration: 4000,
    position: 'top-center',
  });
};