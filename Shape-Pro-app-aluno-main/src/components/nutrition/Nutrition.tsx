import { useState, useEffect } from "react";
import { Loader2, Flame } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { NutritionCard } from "./NutritionCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { useMyNutrition } from "@/hooks/useMyNutrition";
import { useAuth } from "@/hooks/useAuth";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useGamification } from "@/hooks/useGamification";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

export const Nutrition = () => {
  const { user } = useAuth();
  const { light: hapticLight, warning: hapticWarning } = useHapticFeedback();
  const {
    loading, 
    todaysMeals, 
    dailyStats, 
    logMeal 
  } = useMyNutrition();
  const { userPoints } = useGamification();
  const { awardMealPoints } = useGamificationActions();
  const [previousMealCount, setPreviousMealCount] = useState(0);

  // Apenas atualizar contador quando todaysMeals mudar (sem toast)
  useEffect(() => {
    const currentMealCount = todaysMeals.filter(meal => meal.is_logged).length;
    setPreviousMealCount(currentMealCount);
  }, [todaysMeals]);
  
  const handleMealToggle = async (mealPlanItemId: string, isCompleted: boolean) => {
    console.log('[Nutrition] handleMealToggle called:', { mealPlanItemId, isCompleted });
    
    if (!user?.id) return;
    
    // Impedir desmarcação - só permite marcar como consumido uma vez por dia
    if (isCompleted) {
      console.log('[Nutrition] Meal already logged, preventing uncheck');
      hapticWarning();
      toast.error('Refeição já foi registrada hoje! Não é possível desmarcar até amanhã.');
      return;
    }
    
    try {
      console.log('[Nutrition] Logging meal...');
      hapticLight();
      const success = await logMeal(mealPlanItemId, true);
      
      if (success) {
        console.log('[Nutrition] Meal logged successfully, awarding points...');
        await awardMealPoints();
        console.log('[Nutrition] Points awarded successfully');
      } else {
        console.error('[Nutrition] Failed to log meal');
        toast.error('Erro ao registrar refeição. Tente novamente.');
      }
    } catch (error) {
      console.error('[Nutrition] Error logging meal:', error);
      toast.error('Erro ao registrar refeição. Tente novamente.');
    }
  };

  // FASE 2: VALIDAÇÃO - Melhor handling de estados
  if (loading) {
    return (
      <div className="p-4 pt-8 pb-safe flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando seu plano nutricional...</p>
          <p className="text-xs text-muted-foreground">Verificando dados para usuário: {user?.id}</p>
        </div>
      </div>
    );
  }

  // FASE 3: MELHORIAS DE ROBUSTEZ - Error handling e fallbacks
  if (!user?.id) {
    return (
      <div className="p-4 pt-8 pb-safe">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Erro de Autenticação</h2>
          <p className="text-muted-foreground">
            Usuário não autenticado. Por favor, faça login novamente.
          </p>
        </div>
      </div>
    );
  }

  if (!todaysMeals.length) {
    return (
      <div className="p-4 pt-8 pb-safe">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Nutrição</h1>
          <p className="text-muted-foreground">Acompanhe sua alimentação hoje</p>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Nenhum plano nutricional encontrado</h2>
          <p className="text-muted-foreground mb-4">Entre em contato com seu professor para receber um plano alimentar personalizado.</p>
        </div>
      </div>
    );
  }

  const { consumed, target, percentage } = dailyStats;

  return (
    <div className="p-4 pt-8 pb-safe">
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
        {todaysMeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma refeição programada para hoje.</p>
          </div>
        ) : (
          todaysMeals.map((meal) => {
            return (
              <div key={meal.meal_plan_item_id}>
                <NutritionCard
                  title={meal.meal_name}
                  time={meal.meal_time}
                  calories={meal.calories}
                  foods={Array.isArray(meal.foods) ? meal.foods : []}
                  description=""
                  isCompleted={meal.is_logged}
                  onClick={() => handleMealToggle(meal.meal_plan_item_id, meal.is_logged)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};