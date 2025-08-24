import { Utensils, Circle } from "lucide-react";

interface Food {
  id?: number;
  name: string;
  calories: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
  quantity: number;
}

interface NutritionCardProps {
  title: string;
  calories: number;
  time?: string | null;
  foods: Food[] | any; // JSONB field can be array or object
  description?: string;
  isCompleted?: boolean;
  onClick?: () => void;
}

export const NutritionCard = ({ 
  title, 
  calories, 
  time,
  foods, 
  description,
  isCompleted = false,
  onClick 
}: NutritionCardProps) => {
  // Parse foods if it's JSONB or ensure it's an array
  const parsedFoods: Food[] = Array.isArray(foods) ? foods : [];
  
  return (
    <div 
      className="bg-surface/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4 cursor-pointer hover:bg-surface/70 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {title} {time && `- ${time}`}
            </h3>
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
        {parsedFoods.length > 0 ? (
          parsedFoods.slice(0, 3).map((food, index) => (
            <div key={food.id || index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-foreground font-medium">{food.name}</p>
                <p className="text-muted-foreground text-sm">{food.quantity || 100}g</p>
              </div>
              <div className="bg-accent/20 px-3 py-1 rounded-full">
                <span className="text-accent font-medium text-sm">{food.calories} cal</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">Alimentos não especificados</p>
          </div>
        )}
        
        {parsedFoods.length > 3 && (
          <div className="text-center">
            <p className="text-muted-foreground text-xs">
              +{parsedFoods.length - 3} mais alimentos...
            </p>
          </div>
        )}
      </div>

      {description && (
        <div className="mt-4 pt-3 border-t border-border/20">
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      )}
    </div>
  );
};