import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { NutritionCard } from "./NutritionCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { useMyNutrition } from "@/hooks/useMyNutrition";
import { useAuth } from "@/hooks/useAuth";

export const Nutrition = () => {
  const { user } = useAuth();
  const { 
    activePlan, 
    loading, 
    todaysMeals, 
    dailyStats, 
    logMeal 
  } = useMyNutrition();
  
  const handleMealToggle = async (mealId: string, nutritionPlanId: string) => {
    if (!user?.id || !activePlan) return;
    
    try {
      const isAlreadyLogged = todaysMeals.some(log => log.mealId === mealId && log.consumed);
      await logMeal(mealId, nutritionPlanId, !isAlreadyLogged);
    } catch (error) {
      console.error('Error logging meal:', error);
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
        {activePlan.meals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma refeição programada para hoje.</p>
          </div>
        ) : (
          activePlan.meals.map((meal) => {
            const mealLog = todaysMeals.find(log => log.mealId === meal.id);
            const isCompleted = mealLog?.consumed || false;
            
            return (
              <div key={meal.id} onClick={() => handleMealToggle(meal.id, activePlan.id)}>
                <NutritionCard 
                  title={meal.name}
                  calories={meal.calories}
                  foods={meal.ingredients?.map(ingredient => ({
                    name: ingredient,
                    calories: Math.round(meal.calories / (meal.ingredients?.length || 1)),
                    quantity: meal.portion ? `${meal.portion.amount}${meal.portion.unit}` : "1 porção"
                  })) || [{
                    name: meal.name,
                    calories: meal.calories,
                    quantity: "1 porção"
                  }]}
                  description={meal.description || "Refeição nutritiva"}
                  isCompleted={isCompleted}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};