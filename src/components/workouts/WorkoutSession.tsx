import { useState, useEffect } from "react";
import { Pause, Play, Square, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";

interface WorkoutSessionProps {
  workout: {
    id: number;
    name: string;
    type: string;
    duration: number;
    exercises: any[];
  };
  currentExercise?: any;
  onFinish: () => void;
  onExit: () => void;
}

export const WorkoutSession = ({ workout, onFinish, onExit }: Omit<WorkoutSessionProps, 'currentExercise'>) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleFinish = () => {
    setIsRunning(false);
    onFinish();
  };

  const activeExercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header with workout info and controls */}
      <div className="relative p-6 pb-4">
        {/* Top controls bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{workout.name}</h1>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-accent font-bold text-lg">{formatTime(time)}</span>
            </div>
            <p className="text-muted-foreground">{workout.type}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePause}
              className={`px-4 py-2 backdrop-blur-sm border rounded-full font-medium text-sm transition-colors ${
                isPaused 
                  ? "bg-accent/20 border-accent/30 text-accent" 
                  : "bg-accent/20 border-accent/30 text-accent"
              }`}
            >
              {isPaused ? "Continuar" : "Descanso"}
            </button>
            
            <button 
              onClick={handleFinish}
              className="px-4 py-2 bg-accent rounded-full text-background font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              Finalizar
            </button>
            
            <button 
              onClick={onExit}
              className="w-10 h-10 rounded-full bg-surface/20 backdrop-blur-sm border border-border/30 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">{workout.duration}</span>
            <span className="text-xs text-muted-foreground">min</span>
            <span className="text-sm text-muted-foreground">Duração</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Moderado</span>
            <span className="text-sm text-muted-foreground">Dificuldade</span>
          </div>
        </div>
      </div>

      {/* Current exercise section */}
      <div className="px-6 pb-32">
        <h2 className="text-xl font-bold text-foreground mb-4">Exercícios</h2>
        
        {/* Active exercise card */}
        <div className="bg-surface/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{activeExercise?.name || "Burpee"}</h3>
              <p className="text-muted-foreground text-sm">{activeExercise?.type || "Cardio"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePause}
                className="w-10 h-10 rounded-full bg-accent backdrop-blur-sm flex items-center justify-center"
              >
                {isPaused ? (
                  <Play className="w-4 h-4 text-background ml-0.5" />
                ) : (
                  <Pause className="w-4 h-4 text-background" />
                )}
              </button>
            </div>
          </div>

          {/* Video player */}
          <div className="mb-4">
            <VideoPlayer exerciseName={activeExercise?.name || "The Burpee"} />
          </div>
        </div>
      </div>

      {/* Bottom status */}
      <div className="fixed bottom-20 left-4 right-4">
        <Button 
          className={`w-full h-14 font-semibold text-lg rounded-2xl shadow-lg transition-colors ${
            isPaused 
              ? "bg-surface/50 text-muted-foreground cursor-not-allowed" 
              : "bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-background"
          }`}
          disabled={isPaused}
        >
          <Clock className="w-5 h-5 mr-2" />
          {isPaused ? "Treino Pausado" : "Treino em Andamento"}
        </Button>
      </div>
    </div>
  );
};