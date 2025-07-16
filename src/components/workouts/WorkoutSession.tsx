import { useState, useEffect } from "react";
import { ArrowLeft, Pause, Play, Timer, SkipForward } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "./VideoPlayer";

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

  const handleFinish = () => {
    setIsRunning(false);
    onFinish();
  };

  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header com timer */}
      <div className="sticky top-0 z-10 bg-gradient-secondary p-4 text-center">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={onExit}
            className="w-12 h-12 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <h1 className="text-lg font-bold text-white">{workout.name}</h1>
          
          <button
            onClick={handleFinish}
            className="px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-2xl text-white text-sm font-medium"
          >
            Finalizar
          </button>
        </div>
        
        {/* Timer principal */}
        <div className="text-4xl font-bold text-white mb-1">
          {isResting ? formatTime(restTime) : formatTime(time)}
        </div>
        <div className="text-sm text-white/80">
          {isResting ? 'Tempo de Descanso' : 'Tempo de Treino'}
        </div>
      </div>

      {/* Exercício atual em destaque */}
      <div className="p-4">
        <div className="bg-gradient-accent rounded-2xl p-6 mb-6 text-center">
          <h2 className="text-xl font-bold text-background mb-2">Exercício Atual</h2>
          <h3 className="text-2xl font-bold text-background mb-1">{currentExercise.name}</h3>
          <p className="text-background/80 mb-4">{currentExercise.description}</p>
          
          {currentExercise.sets && currentExercise.reps && (
            <div className="bg-background/20 rounded-2xl p-4 mb-4">
              <div className="text-background font-medium">
                {currentExercise.sets} séries × {currentExercise.reps} repetições
              </div>
            </div>
          )}
          
          {currentExercise.duration && (
            <div className="bg-background/20 rounded-2xl p-4 mb-4">
              <div className="text-background font-medium">
                Duração: {currentExercise.duration}
              </div>
            </div>
          )}
        </div>

        {/* Lista de exercícios */}
        <h2 className="text-lg font-bold text-foreground mb-4">Próximos Exercícios</h2>
        
        <div className="grid grid-cols-1 gap-3">
          {workout.exercises.map((exercise, index) => (
            <Card 
              key={exercise.id} 
              className={`${
                index === currentExerciseIndex 
                  ? 'bg-gradient-accent text-background border-accent' 
                  : index < currentExerciseIndex 
                    ? 'bg-muted text-muted-foreground' 
                    : 'bg-card'
              } rounded-2xl transition-all duration-300`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{exercise.name}</h3>
                    <p className="text-sm opacity-80">{exercise.type}</p>
                    {exercise.sets && exercise.reps && (
                      <p className="text-xs opacity-70 mt-1">
                        {exercise.sets} × {exercise.reps}
                      </p>
                    )}
                  </div>
                  
                  <div className="w-12 h-12 rounded-2xl bg-background/20 flex items-center justify-center">
                    <span className="font-bold">
                      {index < currentExerciseIndex ? '✓' : index + 1}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Controles fixos */}
      <div className="fixed bottom-24 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center justify-center gap-6 mb-3">
          <button
            onClick={handlePause}
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
          >
            {isPaused ? <Play className="w-8 h-8 text-primary-foreground" /> : <Pause className="w-8 h-8 text-primary-foreground" />}
          </button>
          
          <button
            onClick={handleRest}
            className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg"
            disabled={isResting}
          >
            <Timer className="w-8 h-8 text-background" />
          </button>
          
          <button
            onClick={handleNextExercise}
            className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center shadow-lg"
          >
            <SkipForward className="w-8 h-8 text-background" />
          </button>
        </div>
        
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {isPaused ? 'Treino Pausado' : isResting ? 'Descansando...' : 'Treinando'}
          </span>
        </div>
      </div>
    </div>
  );
};