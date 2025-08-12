import { useState, useCallback } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWorkouts } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { WorkoutCard } from "./WorkoutCard";
import { WorkoutDetail } from "./WorkoutDetail";
import { ExerciseDetail } from "./ExerciseDetail";
import { WorkoutSession } from "./WorkoutSession";

type ViewState = 'list' | 'detail' | 'exercise' | 'session';

export const Workouts = () => {
  const { user } = useAuth();
  const { workouts, loading } = useWorkouts(user?.id || "");
  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  // Muscle groups derived from real workout data
  const muscleGroups = ["Todos", ...Array.from(new Set(workouts.flatMap(w => w.muscle_groups || [])))];

  const handleWorkoutSelect = useCallback((workout: any) => {
    const mapped = mapWorkout(workout);
    setSelectedWorkout(mapped);
    setSelectedExercise(null);
    setCurrentView('detail');
  }, []);

  const handleExerciseSelect = useCallback((exercise: any) => {
    setSelectedExercise(exercise);
    setCurrentView('exercise');
  }, []);

  const handleStartWorkout = useCallback(() => {
    setCurrentView('session');
  }, []);

  // Helpers to map Supabase workout to UI shape
  const difficultyPt = (d?: string) => d === 'beginner' ? 'Iniciante' : d === 'intermediate' ? 'Intermediário' : d === 'advanced' ? 'Avançado' : 'Geral';
  const mapExercises = (exs: any[] = []) => exs.map((ex: any, idx: number) => ({
    id: idx + 1,
    name: ex.name || `Exercício ${idx + 1}`,
    type: ex.type || 'Força',
    sets: ex.sets ? String(ex.sets) : undefined,
    reps: ex.reps ? String(ex.reps) : undefined,
    duration: ex.duration ? `${ex.duration} seg` : undefined,
    rest: ex.rest || ex.rest_time ? `${ex.rest || ex.rest_time}s` : '60s',
    description: ex.description || ex.instructions || ''
  }));
  const mapWorkout = (w: any) => ({
    id: w.id,
    name: w.name,
    type: Array.isArray(w.muscle_groups) ? w.muscle_groups.join(', ') : 'Geral',
    duration: w.estimated_duration || 0,
    difficulty: difficultyPt(w.difficulty),
    exercises: mapExercises(w.exercises),
    image: w.image_url
  });

  const handleFinishWorkout = useCallback(() => {
    const points = Math.floor(Math.random() * 50) + 50;
    const achievements = [
      "🔥 Queimador de Calorias!",
      "💪 Força Total!",
      "⚡ Super Atleta!",
      "🏆 Campeão do Dia!",
      "🎯 Meta Atingida!"
    ];
    const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
    
    toast({
      title: `${randomAchievement}`,
      description: `Parabéns! Você ganhou ${points} pontos e completou mais um treino! 🎉`,
    });

    setTimeout(() => {
      toast({
        title: "🚀 Continue assim!",
        description: "Você está cada vez mais forte! Próximo treino em 24h.",
      });
    }, 3000);

    setCurrentView('list');
    setSelectedWorkout(null);
    setSelectedExercise(null);
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedWorkout(null);
    setSelectedExercise(null);
  }, []);

  const handleBackToDetail = useCallback(() => {
    setCurrentView('detail');
    setSelectedExercise(null);
  }, []);

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando seus treinos...</p>
        </div>
      </div>
    );
  }

  // Renderização condicional baseada no estado atual
  if (currentView === 'session' && selectedWorkout) {
    return (
      <WorkoutSession
        workout={selectedWorkout}
        onFinish={handleFinishWorkout}
        onExit={handleBackToList}
      />
    );
  }

  if (currentView === 'exercise' && selectedExercise && selectedWorkout) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        workout={selectedWorkout}
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
        onExerciseSelect={handleExerciseSelect}
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
            className="w-full pl-10 pr-4 py-3 bg-card/50 border border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors ${
                group === "Todos" 
                  ? "bg-accent text-background" 
                  : "bg-card/50 text-muted-foreground hover:bg-card/70"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Grid */}
      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum treino disponível ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde seu professor atribuir treinos para você!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workouts.map((workout) => (
            <WorkoutCard 
              key={workout.id} 
              name={workout.name}
              duration={workout.estimated_duration}
              difficulty={difficultyPt(workout.difficulty)}
              calories={workout.estimated_calories}
              muscleGroup={Array.isArray(workout.muscle_groups) ? workout.muscle_groups.join(', ') : 'Geral'}
              isCompleted={workout.sessions ? workout.sessions > 0 : false}
              onClick={() => handleWorkoutSelect(workout)}
            />
          ))}
        </div>
      )}
    </div>
  );
};