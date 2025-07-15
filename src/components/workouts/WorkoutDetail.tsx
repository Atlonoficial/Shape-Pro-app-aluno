import { useState } from "react";
import { ArrowLeft, Clock, Flame, Dumbbell, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Exercise {
  id: number;
  name: string;
  type: string;
  sets?: string;
  reps?: string;
  duration?: string;
  rest?: string;
  description?: string;
}

interface WorkoutDetailProps {
  workout: {
    id: number;
    name: string;
    type: string;
    duration: number;
    difficulty: string;
    exercises: Exercise[];
    image?: string;
  };
  onBack: () => void;
  onStartWorkout: () => void;
  onExerciseSelect?: (exercise: Exercise) => void;
}

export const WorkoutDetail = ({ workout, onBack, onStartWorkout, onExerciseSelect }: WorkoutDetailProps) => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Header with background image */}
      <div 
        className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col"
        style={{
          backgroundImage: workout.image ? `url(${workout.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back button */}
        <button 
          onClick={onBack}
          className="absolute top-8 left-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm border border-white/20 flex items-center justify-center z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Workout info */}
        <div className="relative z-10 mt-auto p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{workout.name}</h1>
          <p className="text-white/80 mb-4">{workout.type}</p>
          
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{workout.duration} min</span>
              <span className="text-xs text-white/60">Duração</span>
            </div>
            
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{workout.difficulty}</span>
              <span className="text-xs text-white/60">Dificuldade</span>
            </div>
            
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Dumbbell className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{workout.exercises.length}</span>
              <span className="text-xs text-white/60">Exercícios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises list */}
      <div className="p-4 pb-32">
        <h2 className="text-xl font-bold text-foreground mb-4">Exercícios</h2>
        
        <div className="space-y-3">
          {workout.exercises.map((exercise) => (
            <div 
              key={exercise.id}
              className="bg-surface/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 cursor-pointer hover:bg-surface/70 transition-colors"
              onClick={() => onExerciseSelect?.(exercise)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{exercise.name}</h3>
                  <p className="text-muted-foreground text-sm">{exercise.type}</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start workout button */}
      <div className="fixed bottom-20 left-4 right-4">
        <Button 
          onClick={onStartWorkout}
          className="w-full h-14 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-background font-semibold text-lg rounded-2xl shadow-lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Treino
        </Button>
      </div>
    </div>
  );
};