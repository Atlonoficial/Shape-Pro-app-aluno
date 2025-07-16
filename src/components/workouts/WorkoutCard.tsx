import { Clock, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WorkoutCardProps {
  name: string;
  duration: number;
  calories: number;
  difficulty: string;
  muscleGroup: string;
  image: string;
  isCompleted?: boolean;
  onClick?: () => void;
}

export const WorkoutCard = ({ 
  name, 
  duration, 
  calories, 
  difficulty, 
  muscleGroup, 
  image, 
  isCompleted = false,
  onClick 
}: WorkoutCardProps) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'text-green-400';
      case 'Intermediário': return 'text-primary';
      case 'Avançado': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card 
      className="bg-card/50 border-border/50 overflow-hidden hover:bg-card/70 transition-all duration-300 cursor-pointer rounded-2xl"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={image} 
            alt={name}
            className="w-full h-40 object-cover rounded-t-2xl"
          />
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-accent/90 backdrop-blur-sm rounded-xl p-2">
              <div className="w-3 h-3 bg-background rounded-full"></div>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-xl px-3 py-1">
            <span className="text-xs text-foreground font-medium">{muscleGroup}</span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2">{name}</h3>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{duration}min</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-muted-foreground">{calories} cal</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
            
            <button 
              className="bg-accent text-background px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Ver
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};