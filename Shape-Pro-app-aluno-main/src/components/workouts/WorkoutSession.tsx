import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Pause, Play, Timer, SkipForward } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "./VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { awardWorkoutPoints } = useGamificationActions();
  const haptics = useHapticFeedback();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
  const [currentSet, setCurrentSet] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const DEFAULT_REST_TIME = 60; // 60 segundos padrão

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/${tab === 'home' ? '' : tab}`);
  }, [navigate]);

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

  const handleNextExercise = async () => {
    await haptics.medium();
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      handleRest();
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsRunning(false);
    setIsSaving(true);
    
    try {
      await haptics.success();
      await saveWorkoutSession();
      onFinish();
    } finally {
      setIsSaving(false);
    }
  };

  const calculateWorkoutPoints = () => {
    const minutes = Math.floor(time / 60);
    return Math.min(100, 30 + minutes * 2);
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
          total_duration: Math.floor(time / 60),
          exercises: {
            completed: currentExerciseIndex + 1,
            total: workout.exercises.length
          } as any
        });

      if (error) {
        console.error('Error saving workout session:', error);
        toast.error('Erro ao salvar treino');
        return;
      }

      // Dar pontos manualmente
      await awardWorkoutPoints(workout.name);

      // Registrar atividade diária
      await supabase.rpc('register_daily_activity');

      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });

      const points = calculateWorkoutPoints();
      toast.success(`Treino concluído! +${points} pontos 🎉`);
    } catch (error) {
      console.error('Error saving workout session:', error);
      toast.error('Erro ao salvar treino');
    }
  };

  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header com timer */}
      <div className="flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/80 p-4 pt-safe text-center">
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
            disabled={isSaving}
            className="px-3 py-2 bg-destructive/80 backdrop-blur-sm rounded-2xl text-white text-sm font-medium hover:bg-destructive transition-colors disabled:opacity-50"
          >
            {isSaving ? '⏳ Salvando...' : 'Finalizar'}
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

      {/* Estatísticas em tempo real */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-4 mb-4 relative z-10">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {currentExerciseIndex + 1}/{workout.exercises.length}
            </div>
            <div className="text-xs text-muted-foreground">Exercícios</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-warning">
              {Object.values(completedSets).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Séries</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {calculateWorkoutPoints()}
            </div>
            <div className="text-xs text-muted-foreground">Pontos</div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto pb-safe-2xl">
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
                    {currentExercise.sets} séries × {currentExercise.reps} repetições
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

            {/* Controle de Séries */}
            {currentExercise.sets && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-background font-semibold">
                    Série {currentSet} de {currentExercise.sets}
                  </span>
                  <span className="text-background/80 text-sm">
                    {completedSets[currentExerciseIndex] || 0}/{currentExercise.sets} concluídas
                  </span>
                </div>
                
                {/* Botão de série concluída */}
                <button
                  onClick={async () => {
                    const totalSets = parseInt(currentExercise.sets || '0');
                    const currentCompleted = completedSets[currentExerciseIndex] || 0;
                    
                    if (currentCompleted >= totalSets) return;
                    
                    await haptics.light();
                    const newCompleted = currentCompleted + 1;
                    setCompletedSets(prev => ({
                      ...prev,
                      [currentExerciseIndex]: newCompleted
                    }));
                    setCurrentSet(prev => Math.min(prev + 1, totalSets));
                    toast.success(`Série ${newCompleted} concluída!`);
                  }}
                  disabled={(completedSets[currentExerciseIndex] || 0) >= parseInt(currentExercise.sets || '0')}
                  className="w-full py-3 bg-background/20 rounded-2xl font-semibold hover:bg-background/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Série Concluída
                </button>
                
                {/* Indicadores visuais de séries */}
                <div className="flex gap-2">
                  {Array.from({ length: parseInt(currentExercise.sets) }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        i < (completedSets[currentExerciseIndex] || 0)
                          ? 'bg-background'
                          : 'bg-background/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lista de exercícios */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Próximos Exercícios</h2>
            
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => {
                const isCompleted = index < currentExerciseIndex;
                const isCurrent = index === currentExerciseIndex;
                const isPending = index > currentExerciseIndex;
                
                const setsCompleted = completedSets[index] || 0;
                const totalSets = exercise.sets ? parseInt(exercise.sets) : 0;
                
                return (
                  <Card 
                    key={exercise.id} 
                    className={`${
                      isCurrent 
                        ? 'bg-gradient-accent text-background border-accent shadow-lg scale-105' 
                        : isCompleted 
                          ? 'bg-success/20 text-foreground border-success' 
                          : 'bg-card/50 border-border'
                    } rounded-2xl transition-all duration-300`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{exercise.name}</h3>
                          <p className="text-sm opacity-80 mb-1">{exercise.type}</p>
                          
                          {exercise.sets && exercise.reps && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs opacity-70">
                                {exercise.sets} × {exercise.reps}
                              </p>
                              {isCurrent && totalSets > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-background/20 rounded-full">
                                  {setsCompleted}/{totalSets}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ml-3 flex-shrink-0 ${
                          isCurrent ? 'bg-background/20' :
                          isCompleted ? 'bg-success' :
                          'bg-muted/50'
                        }`}>
                          <span className="font-bold text-lg">
                            {isCompleted ? '✓' : isCurrent ? '▶' : index + 1}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Controles fixos */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/30 pb-safe-2xl z-40">
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

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="workouts" onTabChange={handleTabChange} />
    </div>
  );
};