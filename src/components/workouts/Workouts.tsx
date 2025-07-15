import { Search, Filter } from "lucide-react";
import { WorkoutCard } from "./WorkoutCard";

const workouts = [
  {
    id: 1,
    title: "Treino de Peito e Tríceps",
    duration: 45,
    calories: 320,
    difficulty: 'Intermediário' as const,
    muscleGroup: "Peitoral",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    isCompleted: false
  },
  {
    id: 2,
    title: "Cardio HIIT Intenso",
    duration: 30,
    calories: 280,
    difficulty: 'Avançado' as const,
    muscleGroup: "Cardio",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=400",
    isCompleted: true
  },
  {
    id: 3,
    title: "Costas e Bíceps",
    duration: 50,
    calories: 340,
    difficulty: 'Intermediário' as const,
    muscleGroup: "Costas",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400",
    isCompleted: false
  },
  {
    id: 4,
    title: "Pernas Completo",
    duration: 60,
    calories: 420,
    difficulty: 'Avançado' as const,
    muscleGroup: "Pernas",
    image: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&q=80&w=400",
    isCompleted: false
  },
  {
    id: 5,
    title: "Ombros e Abdômen",
    duration: 35,
    calories: 250,
    difficulty: 'Iniciante' as const,
    muscleGroup: "Ombros",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    isCompleted: false
  }
];

const muscleGroups = ["Todos", "Peitoral", "Costas", "Pernas", "Ombros", "Cardio"];

export const Workouts = () => {
  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Treinos</h1>
        <p className="text-muted-foreground">Escolha seu treino e vamos começar!</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            placeholder="Buscar treinos..."
            className="w-full pl-10 pr-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                group === "Todos" 
                  ? "bg-primary text-background" 
                  : "bg-card/50 text-muted-foreground hover:bg-card/70"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Grid */}
      <div className="grid grid-cols-1 gap-4">
        {workouts.map((workout) => (
          <WorkoutCard key={workout.id} {...workout} />
        ))}
      </div>
    </div>
  );
};