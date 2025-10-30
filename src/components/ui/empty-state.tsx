import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) => {
  return (
    <Card className="border-dashed animate-fade-up">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="touch-feedback"
            size="lg"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
