import { useState } from "react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { NutritionCard } from "./NutritionCard";
import { MetricCard } from "@/components/ui/MetricCard";

const dailyGoals = {
  calories: 2200,
  protein: 150,
  carbs: 275,
  fat: 73
};

const consumed = {
  calories: 1680,
  protein: 120,
  carbs: 210,
  fat: 58
};

const initialMeals = [
  {
    id: 1,
    title: "Café da Manhã",
    calories: 375,
    foods: [
      { name: "Aveia", calories: 190, quantity: "50g" },
      { name: "Banana", calories: 105, quantity: "1 unidade" },
      { name: "Leite desnatado", calories: 80, quantity: "200ml" }
    ],
    description: "Rica em fibras e carboidratos",
    isCompleted: true
  },
  {
    id: 2,
    title: "Jantar",
    calories: 520,
    foods: [
      { name: "Frango grelhado", calories: 350, quantity: "150g" },
      { name: "Arroz integral", calories: 120, quantity: "80g" },
      { name: "Brócolis", calories: 50, quantity: "100g" }
    ],
    description: "Alto teor de proteínas",
    isCompleted: false
  },
  {
    id: 3,
    title: "Lanche da Tarde",
    calories: 180,
    foods: [
      { name: "Iogurte natural", calories: 120, quantity: "150g" },
      { name: "Granola", calories: 60, quantity: "20g" }
    ],
    description: "Fonte de probióticos",
    isCompleted: false
  }
];

export const Nutrition = () => {
  const [meals, setMeals] = useState(initialMeals);
  
  const calorieProgress = (consumed.calories / dailyGoals.calories) * 100;
  const proteinProgress = (consumed.protein / dailyGoals.protein) * 100;
  const carbsProgress = (consumed.carbs / dailyGoals.carbs) * 100;
  const fatProgress = (consumed.fat / dailyGoals.fat) * 100;

  const handleMealToggle = (mealId: number) => {
    setMeals(prevMeals => 
      prevMeals.map(meal => 
        meal.id === mealId 
          ? { ...meal, isCompleted: !meal.isCompleted }
          : meal
      )
    );
  };

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
            progress={calorieProgress} 
            size={60} 
            strokeWidth={6}
            className="text-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Calorias"
            value={`${consumed.calories}`}
            subtitle={`de ${dailyGoals.calories}`}
            progress={calorieProgress}
            color="primary"
          />
          <MetricCard
            title="Proteína"
            value={`${consumed.protein}g`}
            subtitle={`de ${dailyGoals.protein}g`}
            progress={proteinProgress}
            color="blue"
          />
          <MetricCard
            title="Carboidratos"
            value={`${consumed.carbs}g`}
            subtitle={`de ${dailyGoals.carbs}g`}
            progress={carbsProgress}
            color="green"
          />
          <MetricCard
            title="Gordura"
            value={`${consumed.fat}g`}
            subtitle={`de ${dailyGoals.fat}g`}
            progress={fatProgress}
            color="orange"
          />
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Refeições de Hoje</h3>
        {meals.map((meal) => (
          <div key={meal.id} onClick={() => handleMealToggle(meal.id)}>
            <NutritionCard {...meal} />
          </div>
        ))}
      </div>
    </div>
  );
};