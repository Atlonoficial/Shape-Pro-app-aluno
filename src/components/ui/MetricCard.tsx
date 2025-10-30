import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
  progress?: number;
  color?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className = "",
  onClick,
  progress,
  color = "primary"
}: MetricCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-destructive", 
    neutral: "text-muted-foreground"
  };

  return (
    <div 
      className={`metric-card cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {subtitle && (
          <span className={`text-sm ${trend ? trendColors[trend] : 'text-muted-foreground'}`}>
            {subtitle}
          </span>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-muted/20 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                color === 'primary' ? 'bg-primary' :
                color === 'blue' ? 'bg-blue-500' :
                color === 'green' ? 'bg-green-500' :
                color === 'orange' ? 'bg-orange-500' :
                'bg-primary'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};