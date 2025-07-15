import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { WorkoutCard } from "./WorkoutCard";
import { WorkoutDetail } from "./WorkoutDetail";
import { ExerciseDetail } from "./ExerciseDetail";
import { WorkoutSession } from "./WorkoutSession";

const workouts = [
  {
    id: 1,
    name: "Seca Barriga Woman",
    type: "Cardio",
    duration: 40,
    difficulty: "Moderado",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=400",
    exercises: [
      { 
        id: 1, 
        name: "Burpee", 
        type: "Cardio",
        sets: "3",
        reps: "8-12",
        rest: "60s",
        description: "Exercício completo para queima de calorias"
      },
      { 
        id: 2, 
        name: "Corrida Esteira", 
        type: "Cardio",
        duration: "20 min",
        rest: "2 min",
        description: "Cardio de alta intensidade"
      }
    ],
    calories: 320,
    muscleGroup: "Cardio",
    isCompleted: false
  },
  {
    id: 2,
    name: "Força Total",
    type: "Musculação",
    duration: 45,
    difficulty: "Avançado",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    exercises: [
      { id: 1, name: "Agachamento", type: "Pernas" },
      { id: 2, name: "Supino", type: "Peito" },
      { id: 3, name: "Remada", type: "Costas" }
    ],
    calories: 280,
    muscleGroup: "Peitoral",
    isCompleted: true
  },
  {
    id: 3,
    name: "Yoga Relaxante",
    type: "Flexibilidade",
    duration: 25,
    difficulty: "Iniciante",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400",
    exercises: [
      { id: 1, name: "Posição do Gato", type: "Flexibilidade" },
      { id: 2, name: "Warrior Pose", type: "Equilíbrio" }
    ],
    calories: 150,
    muscleGroup: "Flexibilidade",
    isCompleted: false
  }
];

const muscleGroups = ["Todos", "Peitoral", "Costas", "Pernas", "Ombros", "Cardio"];

type ViewState = 'list' | 'detail' | 'exercise' | 'session';

export const Workouts = () => {
  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const handleWorkoutSelect = (workout: any) => {
    setSelectedWorkout(workout);
    setCurrentView('detail');
  };

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setCurrentView('exercise');
  };

  const handleStartWorkout = () => {
    setCurrentView('session');
  };

  const handleFinishWorkout = () => {
    // Reset to list view and show success
    setCurrentView('list');
    setSelectedWorkout(null);
    setSelectedExercise(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedWorkout(null);
    setSelectedExercise(null);
  };

  const handleBackToDetail = () => {
    setCurrentView('detail');
    setSelectedExercise(null);
  };

  if (currentView === 'session' && selectedWorkout) {
    return (
      <WorkoutSession
        workout={selectedWorkout}
        onFinish={handleFinishWorkout}
        onExit={handleBackToList}
      />
    );
  }

  if (currentView === 'exercise' && selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        onBack={handleBackToDetail}
        onStartExercise={handleStartWorkout}
      />
    );
  }

  if (currentView === 'detail' && selectedWorkout) {
    return (
      <WorkoutDetail
        workout={selectedWorkout}
        onBack={handleBackToList}
        onStartWorkout={handleStartWorkout}
      />
    );
  }

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
          <WorkoutCard 
            key={workout.id} 
            {...workout} 
            onClick={() => handleWorkoutSelect(workout)}
          />
        ))}
      </div>
    </div>
  );
};