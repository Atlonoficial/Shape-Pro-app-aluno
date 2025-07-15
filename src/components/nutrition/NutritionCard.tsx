import { Utensils, Circle } from "lucide-react";

interface NutritionCardProps {
  title: string;
  calories: number;
  foods: Array<{
    name: string;
    calories: number;
    quantity: string;
  }>;
  description?: string;
  isCompleted?: boolean;
}

export const NutritionCard = ({ 
  title, 
  calories, 
  foods, 
  description,
  isCompleted = false 
}: NutritionCardProps) => {
  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{title}</h3>
            <p className="text-muted-foreground text-sm">{calories} calorias</p>
          </div>
        </div>
        
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isCompleted 
            ? "bg-gradient-to-br from-primary to-secondary border-primary" 
            : "border-muted-foreground/30"
        }`}>
          {isCompleted && <Circle className="w-3 h-3 text-white fill-current" />}
        </div>
      </div>

      <div className="space-y-3">
        {foods.map((food, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-foreground font-medium">{food.name}</p>
              <p className="text-muted-foreground text-sm">{food.quantity}</p>
            </div>
            <div className="bg-accent/20 px-3 py-1 rounded-full">
              <span className="text-accent font-medium text-sm">{food.calories} cal</span>
            </div>
          </div>
        ))}
      </div>

      {description && (
        <div className="mt-4 pt-3 border-t border-border/20">
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      )}
    </div>
  );
};