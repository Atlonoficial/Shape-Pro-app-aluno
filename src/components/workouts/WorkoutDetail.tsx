import { useState, useCallback } from "react";
import { ArrowLeft, Clock, Flame, Dumbbell, Play, ChevronDown, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";
import { useExerciseVideo } from "@/hooks/useExerciseVideo";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useNavigate } from "react-router-dom";

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

// Componente para exibir nome do exercício com informações da base de dados
const ExerciseNameDisplay = ({ exerciseName }: { exerciseName: string }) => {
  const { exercise, loading } = useExerciseVideo(exerciseName);
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <h3 className="font-bold text-foreground mb-1 text-lg">
          {exercise?.name || exerciseName}
        </h3>
        {exercise?.name && exercise.name !== exerciseName && (
          <p className="text-xs text-muted-foreground">
            Treino: {exerciseName}
          </p>
        )}
      </div>
      {exercise?.video_url && (
        <div title="Vídeo disponível">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
      )}
    </div>
  );
};

// Componente para exibir informações completas do exercício
const ExerciseInfoDisplay = ({ exerciseName }: { exerciseName: string }) => {
  const { exercise, loading } = useExerciseVideo(exerciseName);
  
  if (loading || !exercise) return null;
  
  return (
    <div className="space-y-2">
      {exercise.instructions && (
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <p className="text-xs text-primary/80 mb-1 font-medium">Instruções</p>
          <p className="text-sm text-foreground">{exercise.instructions}</p>
        </div>
      )}
      {exercise.description && exercise.description !== exercise.instructions && (
        <div className="bg-surface/30 rounded-lg p-3 border border-border/20">
          <p className="text-xs text-muted-foreground mb-1">Descrição Técnica</p>
          <p className="text-sm text-foreground">{exercise.description}</p>
        </div>
      )}
    </div>
  );
};

export const WorkoutDetail = ({ workout, onBack, onStartWorkout, onExerciseSelect }: WorkoutDetailProps) => {
  const navigate = useNavigate();
  const [videoModalExercise, setVideoModalExercise] = useState<Exercise | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/${tab === 'home' ? '' : tab}`);
  }, [navigate]);

  const handlePlayClick = useCallback((e: React.MouseEvent, exercise: Exercise) => {
    e.stopPropagation();
    setVideoModalExercise(exercise);
  }, []);

  const handleExpandClick = useCallback((exercise: Exercise) => {
    setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id);
  }, [expandedExercise]);
  return (
    <div className="relative min-h-screen bg-background">
      {/* Header with background image */}
      <div 
        className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col"
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
        <div className="relative z-10 mt-auto p-4 sm:p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{workout.name}</h1>
          <p className="text-white/80 mb-4">{workout.type}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-background/20 backdrop-blur-sm px-2 sm:px-3 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-accent" />
              <div className="text-center sm:text-left">
                <span className="text-sm font-medium block sm:inline">{workout.duration} min</span>
                <span className="text-xs text-white/60 block sm:inline sm:ml-1">Duração</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-background/20 backdrop-blur-sm px-2 sm:px-3 py-2 rounded-xl">
              <Flame className="w-4 h-4 text-accent" />
              <div className="text-center sm:text-left">
                <span className="text-sm font-medium block sm:inline">{workout.difficulty}</span>
                <span className="text-xs text-white/60 block sm:inline sm:ml-1">Dificuldade</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-background/20 backdrop-blur-sm px-2 sm:px-3 py-2 rounded-xl">
              <Dumbbell className="w-4 h-4 text-accent" />
              <div className="text-center sm:text-left">
                <span className="text-sm font-medium block sm:inline">{workout.exercises.length}</span>
                <span className="text-xs text-white/60 block sm:inline sm:ml-1">Exercícios</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises list */}
      <div className="p-4 pb-safe-xl">
        <h2 className="text-xl font-bold text-foreground mb-4">Exercícios</h2>
        
        <div className="space-y-3">
          {workout.exercises.map((exercise) => (
            <div 
              key={exercise.id}
              className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 transition-all duration-300"
            >
              {/* Header sempre visível */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <ExerciseNameDisplay exerciseName={exercise.name} />
                  <p className="text-muted-foreground text-sm font-medium mt-1">{exercise.type}</p>
                  
                  {/* Informações importantes sempre visíveis */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {exercise.sets && exercise.reps && (
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" />
                        {exercise.sets}x{exercise.reps}
                      </span>
                    )}
                    {exercise.rest && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exercise.rest}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handlePlayClick(e, exercise)}
                    className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center hover:bg-accent/90 transition-all active:scale-95"
                    aria-label="Ver vídeo do exercício"
                  >
                    <Play className="w-5 h-5 text-background ml-0.5" />
                  </button>
                  <button
                    onClick={() => handleExpandClick(exercise)}
                    className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-all active:scale-95"
                    aria-label="Ver detalhes do exercício"
                  >
                    <ChevronDown 
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedExercise === exercise.id ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                </div>
              </div>
              
              {/* Detalhes expandíveis (apenas instruções) */}
              {expandedExercise === exercise.id && (
                <div className="mt-4 pt-4 border-t border-border/20 space-y-3 animate-slide-down">
                  <ExerciseInfoDisplay exerciseName={exercise.name} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start workout button */}
      <div className="fixed bottom-safe left-4 right-4 z-fixed">
        <button 
          onClick={onStartWorkout}
          className="bg-gradient-accent text-background w-full h-16 text-lg font-semibold rounded-2xl hover:bg-accent/90 transition-all duration-300 shadow-lg flex items-center justify-center active:scale-95"
        >
          <Play className="w-6 h-6 mr-2" />
          Iniciar Treino
        </button>
      </div>

      {/* Modal de vídeo fullscreen */}
      {videoModalExercise && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-fade-in"
          onClick={() => setVideoModalExercise(null)}
        >
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
            <h3 className="text-white font-semibold text-lg truncate flex-1">
              {videoModalExercise.name}
            </h3>
            <button 
              onClick={() => setVideoModalExercise(null)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ml-4"
              aria-label="Fechar vídeo"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-2xl animate-scale-in">
              <VideoPlayer exerciseName={videoModalExercise.name} />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="workouts" onTabChange={handleTabChange} />
    </div>
  );
};