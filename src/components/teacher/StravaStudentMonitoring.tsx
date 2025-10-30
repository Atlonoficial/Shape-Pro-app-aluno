import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/MetricCard";
import { useStravaStudentData } from "@/hooks/useStravaStudentData";
import { Activity, Clock, MapPin, Zap, Users, Trophy, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'run':
    case 'running':
      return '🏃‍♂️';
    case 'ride':
    case 'cycling':
      return '🚴‍♂️';
    case 'walk':
    case 'walking':
      return '🚶‍♂️';
    case 'swim':
    case 'swimming':
      return '🏊‍♂️';
    case 'workout':
      return '💪';
    default:
      return '⚡';
  }
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const StravaStudentMonitoring = () => {
  const { studentActivities, studentMetrics, teacherSummary, loading, refresh } = useStravaStudentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Resumo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento Strava</h2>
          <p className="text-muted-foreground">Acompanhe as atividades dos seus alunos</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo */}
      {teacherSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Alunos Conectados"
            value={teacherSummary.total_students_connected}
            icon={<Users className="h-4 w-4" />}
            color="blue"
          />
          <MetricCard
            title="Atividades (7 dias)"
            value={teacherSummary.total_activities_week}
            icon={<Activity className="h-4 w-4" />}
            color="green"
          />
          <MetricCard
            title="Distância (7 dias)"
            value={`${teacherSummary.total_distance_week_km} km`}
            icon={<MapPin className="h-4 w-4" />}
            color="orange"
          />
          <MetricCard
            title="Pontos Strava"
            value={teacherSummary.total_points_awarded}
            icon={<Trophy className="h-4 w-4" />}
            color="primary"
          />
        </div>
      )}

      <Tabs defaultValue="activities" className="w-full">
        <TabsList>
          <TabsTrigger value="activities">Atividades Recentes</TabsTrigger>
          <TabsTrigger value="students">Métricas por Aluno</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          {studentActivities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
                <p className="text-muted-foreground">
                  Seus alunos ainda não conectaram o Strava ou não registraram atividades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {studentActivities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{getActivityIcon(activity.activity_type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{activity.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {activity.activity_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            por <span className="font-medium">{activity.student_name}</span>
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(activity.distance_meters / 1000).toFixed(1)} km
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(activity.duration_seconds)}
                            </div>
                            {activity.calories_burned > 0 && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {activity.calories_burned} cal
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDistanceToNow(new Date(activity.activity_date), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                        {activity.points_earned && activity.points_earned > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            +{activity.points_earned} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {studentMetrics.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
                <p className="text-muted-foreground">
                  Você ainda não possui alunos cadastrados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {studentMetrics.map((student) => (
                <Card key={student.student_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{student.student_name}</CardTitle>
                      <Badge 
                        variant={student.connection_status === 'connected' ? 'default' : 'secondary'}
                      >
                        {student.connection_status === 'connected' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{student.total_activities}</div>
                        <div className="text-xs text-muted-foreground">Atividades</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{student.total_distance_km} km</div>
                        <div className="text-xs text-muted-foreground">Distância</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{student.total_duration_hours}h</div>
                        <div className="text-xs text-muted-foreground">Duração</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{student.total_calories}</div>
                        <div className="text-xs text-muted-foreground">Calorias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{student.total_points_earned}</div>
                        <div className="text-xs text-muted-foreground">Pontos</div>
                      </div>
                    </div>
                    {student.last_activity && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Última atividade: {formatDistanceToNow(new Date(student.last_activity), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};