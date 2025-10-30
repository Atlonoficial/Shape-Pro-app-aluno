import { Flame, Calendar, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStreaks } from "@/hooks/useStreaks";

export const StreakWidget = () => {
  const { streakData, loading } = useStreaks();

  if (loading || !streakData) {
    return (
      <Card className="bg-gradient-to-r from-warning/10 to-destructive/10 border border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-warning animate-pulse" />
            </div>
            <div>
              <div className="h-4 bg-muted/50 rounded w-16 mb-1" />
              <div className="h-3 bg-muted/30 rounded w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { current_streak, longest_streak } = streakData;

  return (
    <Card className="bg-gradient-to-r from-warning/10 to-destructive/10 border border-warning/20 hover:border-warning/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-warning/30 to-destructive/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-warning" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-foreground">
                {current_streak}
              </span>
              <span className="text-sm text-muted-foreground">
                dias consecutivos
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>Recorde: {longest_streak}</span>
              </div>
              
              {current_streak >= 7 && (
                <div className="px-2 py-0.5 bg-warning/20 rounded-full">
                  <span className="text-warning font-medium">🔥 Em chamas!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};