import { useState, useEffect } from "react";
import { Loader2, Flame } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { NutritionCard } from "./NutritionCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { useMyNutrition } from "@/hooks/useMyNutrition";
import { useAuth } from "@/hooks/useAuth";
import { showPointsToast } from "@/components/gamification/PointsToast";
import { useGamification } from "@/hooks/useGamification";
import { toast } from "sonner";

export const Nutrition = () => {
  const { user } = useAuth();
  const { 
    activePlan, 
    loading, 
    todaysMeals, 
    planMeals,
    dailyStats, 
    logMeal 
  } = useMyNutrition();
  const { userPoints } = useGamification();
  const [previousMealCount, setPreviousMealCount] = useState(0);

  // Detectar quando uma refeição é completada para mostrar pontos
  useEffect(() => {
    const currentMealCount = todaysMeals.filter(log => log.consumed).length;
    
    if (currentMealCount > previousMealCount) {
      // Nova refeição foi logada, mostrar toast de pontos
      showPointsToast({
        points: 25,
        activity: "Refeição Registrada!",
        description: "Continue mantendo uma alimentação saudável"
      });
    }
    
    setPreviousMealCount(currentMealCount);
  }, [todaysMeals, previousMealCount]);
  
  const handleMealToggle = async (mealId: string, isCompleted: boolean) => {
    if (!user?.id || !activePlan) return;
    
    // Impedir desmarcação - só permite marcar como consumido uma vez por dia
    if (isCompleted) {
      toast.error('Refeição já foi registrada hoje! Não é possível desmarcar até amanhã.');
      return;
    }
    
    try {
      const success = await logMeal(mealId, true);
      if (!success) {
        toast.error('Erro ao registrar refeição. Tente novamente.');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      toast.error('Erro ao registrar refeição. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando seu plano nutricional...</p>
        </div>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="p-4 pt-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Nutrição</h1>
          <p className="text-muted-foreground">Acompanhe sua alimentação hoje</p>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum plano nutricional disponível ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde seu nutricionista criar um plano para você!</p>
        </div>
      </div>
    );
  }

  const { consumed, target, percentage } = dailyStats;

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Nutrição</h1>
        <p className="text-muted-foreground">Acompanhe sua alimentação hoje</p>
      </div>

      {/* Daily Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Meta Diária</h3>
            <p className="text-sm text-muted-foreground">Progresso de hoje</p>
            {userPoints && (
              <div className="flex items-center gap-1 mt-1">
                <Flame className="w-4 h-4 text-warning" />
                <span className="text-xs text-warning font-medium">
                  {userPoints.current_streak || 0} dias consecutivos
                </span>
              </div>
            )}
          </div>
          <ProgressRing 
            progress={percentage.calories} 
            size={60} 
            strokeWidth={6}
            className="text-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Calorias"
            value={`${Math.round(consumed.calories)}`}
            subtitle={`de ${target.calories}`}
            progress={percentage.calories}
            color="primary"
          />
          <MetricCard
            title="Proteína"
            value={`${Math.round(consumed.protein)}g`}
            subtitle={`de ${target.protein}g`}
            progress={percentage.protein}
            color="blue"
          />
          <MetricCard
            title="Carboidratos"
            value={`${Math.round(consumed.carbs)}g`}
            subtitle={`de ${target.carbs}g`}
            progress={percentage.carbs}
            color="green"
          />
          <MetricCard
            title="Gordura"
            value={`${Math.round(consumed.fat)}g`}
            subtitle={`de ${target.fat}g`}
            progress={percentage.fat}
            color="orange"
          />
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Refeições de Hoje</h3>
        {planMeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma refeição programada para hoje.</p>
          </div>
        ) : (
          planMeals.map((meal) => {
            const mealLog = todaysMeals.find(log => log.meal_id === meal.id);
            const isCompleted = mealLog?.consumed || false;
            
            return (
              <div key={meal.id}>
                <NutritionCard
                  title={meal.name}
                  time={meal.time}
                  calories={meal.calories}
                  foods={meal.foods || []}
                  description=""
                  isCompleted={isCompleted}
                  onClick={() => handleMealToggle(meal.id, isCompleted)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};