import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface NutritionCardProps {
  title: string;
  time: string;
  calories: number;
  targetCalories: number;
  foods: Array<{
    name: string;
    calories: number;
    quantity: string;
  }>;
  isCompleted?: boolean;
}

export const NutritionCard = ({ 
  title, 
  time, 
  calories, 
  targetCalories, 
  foods, 
  isCompleted = false 
}: NutritionCardProps) => {
  const progress = (calories / targetCalories) * 100;
  
  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{time}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ProgressRing 
              progress={progress} 
              size={50} 
              strokeWidth={4}
              className="text-primary"
            />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{calories} kcal</p>
              <p className="text-xs text-muted-foreground">de {targetCalories}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {foods.map((food, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-background/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{food.name}</p>
                <p className="text-xs text-muted-foreground">{food.quantity}</p>
              </div>
              <span className="text-sm text-primary font-medium">{food.calories} kcal</span>
            </div>
          ))}
        </div>

        <button 
          className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isCompleted 
              ? "bg-green-500/20 text-green-400 cursor-default" 
              : "bg-primary/20 hover:bg-primary/30 text-primary"
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? "✓ Concluído" : "Marcar como consumido"}
        </button>
      </CardContent>
    </Card>
  );
};