import { Users, TrendingUp, Clock, Target, Utensils, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTeacherNutrition } from "@/hooks/useTeacherNutrition";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const NutritionDashboard = () => {
  const { studentsProgress, recentActivities, loading } = useTeacherNutrition();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalStudents = studentsProgress.length;
  const activeStudents = studentsProgress.filter(s => s.completed_meals > 0).length;
  const averageAdherence = totalStudents > 0 
    ? studentsProgress.reduce((acc, s) => acc + s.adherence_percentage, 0) / totalStudents 
    : 0;
  const todaysMealsLogged = studentsProgress.reduce((acc, s) => acc + s.completed_meals, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alunos
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos Hoje
            </CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% dos alunos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aderência Média
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(averageAdherence)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refeições Hoje
            </CardTitle>
            <Utensils className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todaysMealsLogged}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progresso dos Alunos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progresso Nutricional dos Alunos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentsProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluno com plano nutricional encontrado
              </div>
            ) : (
              studentsProgress.map((student) => (
                <div key={student.student_id} className="border border-border/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">{student.student_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {student.completed_meals}/{student.total_meals} refeições completadas
                      </p>
                    </div>
                    <Badge 
                      variant={student.adherence_percentage >= 80 ? "default" : 
                               student.adherence_percentage >= 60 ? "secondary" : "destructive"}
                      className="ml-2"
                    >
                      {Math.round(student.adherence_percentage)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aderência</span>
                      <span className="text-foreground">{Math.round(student.adherence_percentage)}%</span>
                    </div>
                    <Progress value={student.adherence_percentage} className="h-2" />
                  </div>

                  {student.daily_calories_target > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Calorias</span>
                        <span className="text-foreground">
                          {Math.round(student.daily_calories_consumed)}/{student.daily_calories_target}
                        </span>
                      </div>
                      <Progress value={student.calories_percentage} className="h-2" />
                    </div>
                  )}

                  {student.last_meal_time && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Última refeição: {student.last_meal_time}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma atividade recente
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-surface/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.consumed ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                    <div>
                      <p className="font-medium text-foreground text-sm">{activity.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.consumed ? 'Completou' : 'Desmarcou'} {activity.meal_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.actual_time && (
                      <p className="text-xs font-medium text-foreground">{activity.actual_time}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};