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

const initialMeals = [
  {
    id: 1,
    title: "Café da Manhã",
    calories: 375,
    protein: 25,
    carbs: 45,
    fat: 12,
    foods: [
      { name: "Aveia", calories: 190, protein: 8, carbs: 30, fat: 4, quantity: "50g" },
      { name: "Banana", calories: 105, protein: 2, carbs: 15, fat: 0, quantity: "1 unidade" },
      { name: "Leite desnatado", calories: 80, protein: 15, carbs: 0, fat: 8, quantity: "200ml" }
    ],
    description: "Rica em fibras e carboidratos",
    isCompleted: false
  },
  {
    id: 2,
    title: "Jantar",
    calories: 520,
    protein: 45,
    carbs: 35,
    fat: 18,
    foods: [
      { name: "Frango grelhado", calories: 350, protein: 35, carbs: 0, fat: 12, quantity: "150g" },
      { name: "Arroz integral", calories: 120, protein: 5, carbs: 25, fat: 2, quantity: "80g" },
      { name: "Brócolis", calories: 50, protein: 5, carbs: 10, fat: 4, quantity: "100g" }
    ],
    description: "Alto teor de proteínas",
    isCompleted: false
  },
  {
    id: 3,
    title: "Lanche da Tarde",
    calories: 180,
    protein: 15,
    carbs: 20,
    fat: 8,
    foods: [
      { name: "Iogurte natural", calories: 120, protein: 10, carbs: 15, fat: 5, quantity: "150g" },
      { name: "Granola", calories: 60, protein: 5, carbs: 5, fat: 3, quantity: "20g" }
    ],
    description: "Fonte de probióticos",
    isCompleted: false
  }
];

export const Nutrition = () => {
  const [meals, setMeals] = useState(initialMeals);
  
  // Calcular nutrientes consumidos dinamicamente
  const consumed = meals.reduce(
    (acc, meal) => {
      if (meal.isCompleted) {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fat += meal.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
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