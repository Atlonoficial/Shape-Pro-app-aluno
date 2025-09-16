import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface DynamicBadgeProps {
  count?: number;
  status?: 'pending' | 'new' | 'complete' | 'incomplete';
  percentage?: number;
  show?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DynamicBadge = ({ 
  count, 
  status, 
  percentage, 
  show = true, 
  className,
  size = 'sm' 
}: DynamicBadgeProps) => {
  if (!show) return null;

  // Se tem contagem, mostra número
  if (count !== undefined && count > 0) {
    return (
      <Badge 
        variant="destructive" 
        className={cn(
          "absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full flex items-center justify-center border-2 border-background",
          size === 'sm' && "text-[10px] h-4 min-w-[16px]",
          size === 'lg' && "text-sm h-6 min-w-[24px]",
          className
        )}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    );
  }

  // Se tem porcentagem, mostra status baseado na %
  if (percentage !== undefined) {
    if (percentage === 100) {
      return (
        <div 
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full",
            size === 'lg' && "w-4 h-4",
            className
          )}
        />
      );
    } else if (percentage >= 50) {
      return (
        <Badge 
          className={cn(
            "absolute -top-2 -right-2 bg-yellow-500 hover:bg-yellow-600 text-background text-xs px-1 py-0 h-5 rounded-full",
            size === 'sm' && "text-[10px] h-4",
            size === 'lg' && "h-6",
            className
          )}
        >
          {percentage}%
        </Badge>
      );
    } else if (percentage > 0) {
      return (
        <Badge 
          variant="destructive"
          className={cn(
            "absolute -top-2 -right-2 text-xs px-1 py-0 h-5 rounded-full",
            size === 'sm' && "text-[10px] h-4", 
            size === 'lg' && "h-6",
            className
          )}
        >
          {percentage}%
        </Badge>
      );
    } else {
      return (
        <Badge 
          variant="outline"
          className={cn(
            "absolute -top-2 -right-2 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950 text-xs px-1.5 py-0 h-5 rounded-full",
            size === 'sm' && "text-[10px] h-4",
            size === 'lg' && "h-6", 
            className
          )}
        >
          Novo
        </Badge>
      );
    }
  }

  // Status específicos
  switch (status) {
    case 'pending':
      return (
        <Badge 
          variant="destructive"
          className={cn(
            "absolute -top-2 -right-2 text-xs px-1.5 py-0 h-5 rounded-full",
            size === 'sm' && "text-[10px] h-4",
            size === 'lg' && "h-6",
            className
          )}
        >
          !
        </Badge>
      );
    
    case 'new':
      return (
        <Badge 
          variant="outline"
          className={cn(
            "absolute -top-2 -right-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950 text-xs px-1.5 py-0 h-5 rounded-full",
            size === 'sm' && "text-[10px] h-4",
            size === 'lg' && "h-6",
            className
          )}
        >
          Novo
        </Badge>
      );
    
    case 'complete':
      return (
        <div 
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full",
            size === 'lg' && "w-4 h-4",
            className
          )}
        />
      );
    
    default:
      return null;
  }
};