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

const meals = [
  {
    id: 1,
    title: "Café da Manhã",
    time: "07:30",
    calories: 420,
    targetCalories: 500,
    foods: [
      { name: "Aveia com banana", calories: 280, quantity: "1 porção" },
      { name: "Café com leite", calories: 90, quantity: "1 xícara" },
      { name: "Mel", calories: 50, quantity: "1 colher" }
    ],
    isCompleted: true
  },
  {
    id: 2,
    title: "Almoço",
    time: "12:00",
    calories: 650,
    targetCalories: 700,
    foods: [
      { name: "Frango grelhado", calories: 350, quantity: "150g" },
      { name: "Arroz integral", calories: 180, quantity: "1 xícara" },
      { name: "Brócolis", calories: 40, quantity: "1 porção" },
      { name: "Azeite", calories: 80, quantity: "1 colher" }
    ],
    isCompleted: true
  },
  {
    id: 3,
    title: "Lanche",
    time: "15:30",
    calories: 180,
    targetCalories: 300,
    foods: [
      { name: "Iogurte grego", calories: 120, quantity: "1 pote" },
      { name: "Granola", calories: 60, quantity: "1 colher" }
    ],
    isCompleted: false
  },
  {
    id: 4,
    title: "Jantar",
    time: "19:00",
    calories: 0,
    targetCalories: 600,
    foods: [
      { name: "Salmão grelhado", calories: 300, quantity: "150g" },
      { name: "Batata doce", calories: 160, quantity: "1 média" },
      { name: "Salada verde", calories: 40, quantity: "1 porção" },
      { name: "Azeite", calories: 100, quantity: "1 colher" }
    ],
    isCompleted: false
  }
];

export const Nutrition = () => {
  const calorieProgress = (consumed.calories / dailyGoals.calories) * 100;
  const proteinProgress = (consumed.protein / dailyGoals.protein) * 100;
  const carbsProgress = (consumed.carbs / dailyGoals.carbs) * 100;
  const fatProgress = (consumed.fat / dailyGoals.fat) * 100;

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
          <NutritionCard key={meal.id} {...meal} />
        ))}
      </div>
    </div>
  );
};