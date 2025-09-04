import { useState, useEffect } from "react";
import { ArrowLeft, Pause, Play, Timer, SkipForward } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "./VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

interface Exercise {
  id: number;
  name: string;
  type: string;
  sets?: string;
  reps?: string;
  duration?: string;
  rest: string;
  description: string;
}

interface WorkoutSessionProps {
  workout: {
    id: number;
    name: string;
    type: string;
    duration: number;
    exercises: Exercise[];
  };
  onFinish: () => void;
  onExit: () => void;
}

export const WorkoutSession = ({ workout, onFinish, onExit }: WorkoutSessionProps) => {
  const { user } = useAuth();
  const { awardWorkoutPoints } = useGamificationActions();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const DEFAULT_REST_TIME = 60; // 60 segundos padrão

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        if (isResting && restTime > 0) {
          setRestTime(prev => prev - 1);
        } else if (isResting && restTime === 0) {
          setIsResting(false);
          setTime(prevTime => prevTime + 1);
        } else {
          setTime(prevTime => prevTime + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, isResting, restTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRest = () => {
    setIsResting(true);
    setRestTime(DEFAULT_REST_TIME);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      handleRest();
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsRunning(false);
    await saveWorkoutSession();
    onFinish();
  };

  const saveWorkoutSession = async () => {
    try {
      if (!user?.id) return;

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (time * 1000));

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_id: workout.id.toString(),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_duration: Math.floor(time / 60), // converter segundos para minutos
          exercises: {
            completed: currentExerciseIndex + 1,
            total: workout.exercises.length
          } as any
        });

      if (error) {
        console.error('Error saving workout session:', error);
        toast.error('Erro ao salvar treino');
      } else {
        // Points are automatically awarded by database triggers - no manual call needed
        // This prevents duplicate points from being awarded
        toast.success('Treino concluído com sucesso! 🎉');
      }
    } catch (error) {
      console.error('Error saving workout session:', error);
      toast.error('Erro ao salvar treino');
    }
  };

  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header com timer */}
      <div className="flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/80 p-4 text-center">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onExit}
            className="w-10 h-10 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center hover:bg-background/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <h1 className="text-lg font-semibold text-white truncate mx-4">{workout.name}</h1>
          
          <button
            onClick={handleFinish}
            className="px-3 py-2 bg-destructive/80 backdrop-blur-sm rounded-2xl text-white text-sm font-medium hover:bg-destructive transition-colors"
          >
            Finalizar
          </button>
        </div>
        
        {/* Timer principal */}
        <div className="text-5xl font-bold text-white mb-2">
          {isResting ? formatTime(restTime) : formatTime(time)}
        </div>
        <div className="text-sm text-white/90 font-medium">
          {isResting ? 'Tempo de Descanso' : 'Tempo de Treino'}
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Exercício atual em destaque */}
        <div className="p-6">
          <div className="bg-gradient-accent rounded-3xl p-6 mb-6 text-center shadow-lg">
            <h2 className="text-lg font-semibold text-background mb-2 opacity-90">Exercício Atual</h2>
            <h3 className="text-2xl font-bold text-background mb-3">{currentExercise.name}</h3>
            <p className="text-background/80 mb-4 text-sm leading-relaxed">{currentExercise.description}</p>
            
            <div className="space-y-3">
              {currentExercise.sets && currentExercise.reps && (
                <div className="bg-background/20 rounded-2xl p-3">
                  <div className="text-background font-semibold text-sm">
                    Duração: {currentExercise.sets} séries × {currentExercise.reps} repetições
                  </div>
                </div>
              )}
              
              {currentExercise.duration && (
                <div className="bg-background/20 rounded-2xl p-3">
                  <div className="text-background font-semibold text-sm">
                    Duração: {currentExercise.duration}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lista de exercícios */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Próximos Exercícios</h2>
            
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <Card 
                  key={exercise.id} 
                  className={`${
                    index === currentExerciseIndex 
                      ? 'bg-gradient-accent text-background border-accent shadow-lg' 
                      : index < currentExerciseIndex 
                        ? 'bg-muted/50 text-muted-foreground border-muted' 
                        : 'bg-card/50 border-border hover:bg-card/80'
                  } rounded-2xl transition-all duration-300 backdrop-blur-sm`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate">{exercise.name}</h3>
                        <p className="text-sm opacity-80 mb-1">{exercise.type}</p>
                        {exercise.sets && exercise.reps && (
                          <p className="text-xs opacity-70">
                            {exercise.sets} × {exercise.reps}
                          </p>
                        )}
                      </div>
                      
                      <div className="w-12 h-12 rounded-2xl bg-background/20 flex items-center justify-center ml-3 flex-shrink-0">
                        <span className="font-bold text-lg">
                          {index < currentExerciseIndex ? '✓' : index + 1}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controles fixos */}
      <div className="fixed bottom-20 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/30">
        <div className="p-4">
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={handlePause}
              className="w-14 h-14 rounded-2xl bg-accent shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
              title={isPaused ? "Continuar" : "Pausar"}
            >
              {isPaused ? <Play className="w-6 h-6 text-background" /> : <Pause className="w-6 h-6 text-background" />}
            </button>
            
            <button
              onClick={handleRest}
              className="w-14 h-14 rounded-2xl bg-accent shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
              disabled={isResting}
              title="Descansar"
            >
              <Timer className="w-6 h-6 text-background" />
            </button>
            
            <button
              onClick={handleNextExercise}
              className="w-14 h-14 rounded-2xl bg-muted shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
              title="Próximo exercício"
            >
              <SkipForward className="w-6 h-6 text-background" />
            </button>
          </div>
          
          {/* Barra de progresso */}
          <div className="mb-3">
            <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-accent transition-all duration-500 ease-out"
                style={{ 
                  width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Exercício {currentExerciseIndex + 1}</span>
              <span>{workout.exercises.length} total</span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-sm font-medium text-muted-foreground">
              {isPaused ? 'Treino Pausado' : isResting ? 'Descansando...' : 'Treinando'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};