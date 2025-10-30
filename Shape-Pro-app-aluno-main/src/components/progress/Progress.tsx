import { useState } from "react";
import { Calendar, TrendingUp, Target, Award, Activity, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const workoutHistory = [
  {
    id: 1,
    date: "2024-01-15",
    name: "Seca Barriga Woman",
    type: "Cardio",
    duration: 40,
    caloriesBurned: 320,
    completed: true,
    exercises: 8
  },
  {
    id: 2,
    date: "2024-01-14",
    name: "Força Total",
    type: "Musculação", 
    duration: 45,
    caloriesBurned: 280,
    completed: true,
    exercises: 6
  },
  {
    id: 3,
    date: "2024-01-13",
    name: "Yoga Relaxante",
    type: "Flexibilidade",
    duration: 25,
    caloriesBurned: 150,
    completed: false,
    exercises: 4
  }
];

const achievements = [
  {
    id: 1,
    title: "Primeira Semana",
    description: "Complete 7 dias consecutivos",
    icon: Award,
    unlocked: true,
    date: "2024-01-10"
  },
  {
    id: 2,
    title: "Queimador de Calorias",
    description: "Queime 1000 calorias em uma semana",
    icon: TrendingUp,
    unlocked: true,
    date: "2024-01-12"
  },
  {
    id: 3,
    title: "Consistência",
    description: "30 dias de treino",
    icon: Target,
    unlocked: false,
    date: null
  }
];

const weeklyStats = {
  workouts: 5,
  totalDuration: 180,
  caloriesBurned: 1250,
  streak: 7
};

export const Progress = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'achievements'>('history');

  return (
    <div className="p-4 pt-8 pb-safe">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Progresso</h1>
        <p className="text-muted-foreground">Acompanhe sua evolução</p>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="card-gradient">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{weeklyStats.workouts}</p>
            <p className="text-xs text-muted-foreground">Treinos esta semana</p>
          </CardContent>
        </Card>
        
        <Card className="card-gradient">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{weeklyStats.totalDuration}min</p>
            <p className="text-xs text-muted-foreground">Tempo total</p>
          </CardContent>
        </Card>
        
        <Card className="card-gradient">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{weeklyStats.caloriesBurned}</p>
            <p className="text-xs text-muted-foreground">Calorias queimadas</p>
          </CardContent>
        </Card>
        
        <Card className="card-gradient">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{weeklyStats.streak}</p>
            <p className="text-xs text-muted-foreground">Dias consecutivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'history' 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Histórico
        </button>
        
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'achievements' 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          <Award className="w-4 h-4 mr-2" />
          Conquistas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Treinos Recentes</h3>
          
          {workoutHistory.map((workout) => (
            <Card key={workout.id} className="card-gradient">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{workout.name}</h4>
                    <p className="text-sm text-muted-foreground">{workout.type}</p>
                  </div>
                  <Badge 
                    variant={workout.completed ? "default" : "secondary"}
                    className={workout.completed ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}
                  >
                    {workout.completed ? "Concluído" : "Incompleto"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{workout.duration}min</p>
                    <p className="text-muted-foreground">Duração</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{workout.caloriesBurned}</p>
                    <p className="text-muted-foreground">Calorias</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{workout.exercises}</p>
                    <p className="text-muted-foreground">Exercícios</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(workout.date).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Suas Conquistas</h3>
          
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <Card 
                key={achievement.id} 
                className={`card-gradient ${achievement.unlocked ? '' : 'opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.unlocked 
                        ? 'bg-primary/20' 
                        : 'bg-muted/20'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        achievement.unlocked 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Desbloqueado em {new Date(achievement.date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    {achievement.unlocked && (
                      <Badge className="bg-success text-success-foreground">
                        Desbloqueado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};