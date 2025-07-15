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
      className="bg-card/50 border-border/50 overflow-hidden hover:bg-card/70 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={image} 
            alt={name}
            className="w-full h-32 object-cover"
          />
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-sm rounded-full p-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-background/20 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-xs text-white font-medium">{muscleGroup}</span>
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
              className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Iniciar
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};