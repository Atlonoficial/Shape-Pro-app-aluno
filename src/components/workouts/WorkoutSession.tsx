import { useState, useEffect } from "react";
import { Pause, Square, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export const WorkoutSession = ({ workout, currentExercise, onFinish, onExit }: WorkoutSessionProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

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

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header with background image and controls */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Top controls bar */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-white font-bold text-lg">{formatTime(time)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePause}
              className="px-4 py-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full text-accent font-medium text-sm"
            >
              {isPaused ? "Continuar" : "Descanso"}
            </button>
            
            <button 
              onClick={handleFinish}
              className="px-4 py-2 bg-accent backdrop-blur-sm rounded-full text-background font-medium text-sm"
            >
              Finalizar
            </button>
            
            <button 
              onClick={onExit}
              className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Workout info */}
        <div className="relative z-10 mt-auto p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{workout.name}</h1>
          <p className="text-white/80 mb-4">{workout.type}</p>
          
          {/* Current exercise info */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{workout.duration} min</span>
              <span className="text-xs text-white/60">Duração</span>
            </div>
            
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <span className="text-sm font-medium">Moderado</span>
              <span className="text-xs text-white/60">Dificuldade</span>
            </div>
            
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <span className="text-sm font-medium">2</span>
              <span className="text-xs text-white/60">Exercícios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current exercise */}
      <div className="p-4 pb-32">
        <h2 className="text-xl font-bold text-foreground mb-4">Exercícios</h2>
        
        {/* Active exercise card */}
        <div className="bg-surface/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Burpee</h3>
              <p className="text-muted-foreground text-sm">Cardio</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePause}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
              >
                {isPaused ? (
                  <div className="w-4 h-4 bg-white rounded-sm" />
                ) : (
                  <Pause className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Video placeholder */}
          <div className="aspect-video bg-surface/30 rounded-xl mb-4 flex items-center justify-center border border-border/20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2 mx-auto">
                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
              </div>
              <p className="text-muted-foreground text-sm">The Burpee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-20 left-4 right-4">
        <Button 
          className="w-full h-14 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-background font-semibold text-lg rounded-2xl shadow-lg"
          disabled={isPaused}
        >
          <Clock className="w-5 h-5 mr-2" />
          {isPaused ? "Treino Pausado" : "Treino em Andamento"}
        </Button>
      </div>
    </div>
  );
};