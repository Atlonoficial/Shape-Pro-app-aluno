import { Trophy, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  points: number;
  showTrend?: boolean;
  recentGain?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const PointsDisplay = ({ 
  points, 
  showTrend = false, 
  recentGain, 
  className, 
  size = "md",
  animated = false 
}: PointsDisplayProps) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Trophy className={cn("text-warning", iconSizes[size])} />
        <span className={cn(
          "font-bold text-foreground",
          sizeClasses[size],
          animated && "transition-all duration-500"
        )}>
          {points.toLocaleString("pt-BR")}
        </span>
        <span className={cn(
          "text-muted-foreground font-normal",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}>
          pts
        </span>
      </div>

      {showTrend && recentGain && recentGain > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full">
          <Plus className="w-3 h-3" />
          <span className="text-xs font-medium">
            {recentGain.toLocaleString("pt-BR")}
          </span>
        </div>
      )}
    </div>
  );
};