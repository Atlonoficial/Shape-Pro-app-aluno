import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  show?: boolean;
}

export const NotificationBadge = ({ count, className, show = true }: NotificationBadgeProps) => {
  if (!show || count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 h-5 w-5 min-w-[20px] bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background transition-all duration-300 animate-in zoom-in-50",
        count > 9 && "px-1",
        className
      )}
    >
      {displayCount}
    </div>
  );
};