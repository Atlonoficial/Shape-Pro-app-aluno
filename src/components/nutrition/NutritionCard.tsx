import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Utensils, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Food {
  id?: string | number;
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
    <Card 
      className={cn(
        "p-4 transition-all duration-200",
        isCompleted 
          ? "bg-gradient-to-r from-success/20 to-success/10 border-success/50 cursor-not-allowed" 
          : "bg-card border-border hover:border-accent/50 cursor-pointer hover:shadow-md"
      )}
      onClick={isCompleted ? undefined : onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-lg">
              {title} {time && `- ${time}`}
            </h3>
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <div className="w-5 h-5 border-2 border-muted-foreground/30 rounded-full" />
            )}
          </div>
          
          <div className="flex items-center gap-1 text-sm text-accent">
            <Utensils className="w-4 h-4" />
            <span>{Math.round(calories)} kcal</span>
          </div>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Até amanhã</span>
          </div>
        )}
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

      <div className={cn(
        "text-xs font-medium mt-2 flex items-center gap-1",
        isCompleted ? "text-success" : "text-muted-foreground"
      )}>
        {isCompleted ? (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>Registrada hoje - disponível amanhã</span>
          </>
        ) : (
          <span>Toque para marcar como consumida</span>
        )}
      </div>
    </Card>
  );
};