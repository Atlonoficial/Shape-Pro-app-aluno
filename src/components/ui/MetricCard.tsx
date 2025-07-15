import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
}

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className = "",
  onClick 
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
    </div>
  );
};