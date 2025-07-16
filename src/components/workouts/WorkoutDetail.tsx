import { useState } from "react";
import { ArrowLeft, Clock, Flame, Dumbbell, Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";

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
  const [selectedExercisePreview, setSelectedExercisePreview] = useState<number | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
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
              className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 transition-all duration-300"
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setExpandedExercise(
                    expandedExercise === exercise.id ? null : exercise.id
                  );
                }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{exercise.name}</h3>
                  <p className="text-muted-foreground text-sm">{exercise.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedExercisePreview(
                        selectedExercisePreview === exercise.id ? null : exercise.id
                      );
                    }}
                    className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors"
                  >
                    <Play className="w-5 h-5 text-background ml-0.5" />
                  </button>
                  <ChevronDown 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedExercise === exercise.id ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </div>
              
              {/* Exercise details expandible */}
              {expandedExercise === exercise.id && (
                <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
                  {exercise.sets && exercise.reps && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">{exercise.sets} séries x {exercise.reps} reps</span>
                    </div>
                  )}
                  {exercise.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">{exercise.duration}</span>
                    </div>
                  )}
                  {exercise.rest && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-sm text-foreground">Descanso: {exercise.rest}</span>
                    </div>
                  )}
                  {exercise.description && (
                    <div className="flex items-start gap-2">
                      <Dumbbell className="w-4 h-4 text-accent mt-0.5" />
                      <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    </div>
                  )}
                  
                  {/* Video preview inside expanded section */}
                  {selectedExercisePreview === exercise.id && (
                    <div className="mt-4 pt-4 border-t border-border/20">
                      <VideoPlayer exerciseName={exercise.name} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start workout button */}
      <div className="fixed bottom-20 left-4 right-4">
        <button 
          onClick={onStartWorkout}
          className="bg-gradient-accent text-background w-full h-16 text-lg font-semibold rounded-2xl hover:bg-accent/90 transition-all duration-300 shadow-lg flex items-center justify-center"
        >
          <Play className="w-6 h-6 mr-2" />
          Iniciar Treino
        </button>
      </div>
    </div>
  );
};