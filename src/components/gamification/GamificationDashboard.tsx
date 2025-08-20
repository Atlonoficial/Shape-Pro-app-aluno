import { useEffect, useState } from "react";
import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, Users, Calendar, Award, TrendingUp, Flame } from "lucide-react";

export const GamificationDashboard = () => {
  const {
    userPoints,
    activities,
    achievements,
    userAchievements,
    rankings,
    challenges,
    loading,
    getLevelInfo,
    joinChallenge
  } = useGamification();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-card/60 border border-border/50 rounded-lg animate-pulse" />
        <div className="h-64 bg-card/60 border border-border/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const levelInfo = userPoints ? getLevelInfo(userPoints.total_points) : null;

  return (
    <div className="p-4 pb-24 space-y-6 max-w-4xl mx-auto">
      {/* Header com Pontos e Nível */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gamificação</h1>
              <p className="text-muted-foreground">Seu progresso e conquistas</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-warning" />
                <span className="text-2xl font-bold text-foreground">
                  {userPoints?.total_points?.toLocaleString("pt-BR") || "0"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">pontos totais</p>
            </div>
          </div>

          {levelInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="px-3 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  {levelInfo.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Nível {levelInfo.level}
                </span>
              </div>
              <div className="space-y-1">
                <Progress value={levelInfo.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {levelInfo.progressToNext} / {levelInfo.pointsNeeded} pontos para o próximo nível
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="challenges">Desafios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{userPoints?.level || 1}</p>
                <p className="text-xs text-muted-foreground">Nível Atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-2xl font-bold">{userAchievements.length}</p>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Flame className="w-4 h-4 text-accent" />
                </div>
                <p className="text-2xl font-bold">{userPoints?.current_streak || 0}</p>
                <p className="text-xs text-muted-foreground">Sequência</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{userPoints?.longest_streak || 0}</p>
                <p className="text-xs text-muted-foreground">Melhor</p>
              </CardContent>
            </Card>
          </div>

          {/* Atividades Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activities.length > 0 ? activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      +{activity.points_earned} pts
                    </Badge>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma atividade ainda. Comece a usar o app para ganhar pontos!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {/* Conquistas Desbloqueadas */}
            {userAchievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-warning" />
                    Conquistas Desbloqueadas ({userAchievements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userAchievements.map((userAchievement) => (
                      <div key={userAchievement.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
                        <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-warning" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{userAchievement.achievement.title}</h4>
                          <p className="text-xs text-muted-foreground">{userAchievement.achievement.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {userAchievement.achievement.rarity}
                            </Badge>
                            <span className="text-xs text-warning">+{userAchievement.points_earned} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conquistas Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Conquistas Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.filter(achievement => 
                    !userAchievements.some(ua => ua.achievement_id === achievement.id)
                  ).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg opacity-60">
                      <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {achievement.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">+{achievement.points_reward} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {achievements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma conquista disponível no momento
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ranking Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankings.map((ranking, index) => (
                  <div 
                    key={ranking.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      ranking.user_id === userPoints?.user_id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-warning text-warning-foreground' :
                      index === 1 ? 'bg-muted text-muted-foreground' :
                      index === 2 ? 'bg-secondary text-secondary-foreground' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      {ranking.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ranking.profile?.name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{ranking.total_points.toLocaleString("pt-BR")} pontos</p>
                    </div>
                    {index < 3 && (
                      <Trophy className={`w-5 h-5 ${
                        index === 0 ? 'text-warning' :
                        index === 1 ? 'text-muted-foreground' :
                        'text-secondary'
                      }`} />
                    )}
                  </div>
                ))}
                {rankings.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ranking ainda não disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                    </div>
                    <Badge variant={challenge.participation?.completed ? "default" : "outline"}>
                      {challenge.participation?.completed ? "Concluído" : "Ativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso:</span>
                      <span>
                        {challenge.participation?.current_progress || 0} / {challenge.target_value}
                      </span>
                    </div>
                    
                    <Progress 
                      value={((challenge.participation?.current_progress || 0) / challenge.target_value) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(challenge.start_date).toLocaleDateString("pt-BR")} - {new Date(challenge.end_date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {challenge.points_reward} pts
                      </span>
                    </div>
                    
                    {!challenge.participation && (
                      <button
                        onClick={() => joinChallenge(challenge.id)}
                        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Aceitar Desafio
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {challenges.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum desafio ativo no momento</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};