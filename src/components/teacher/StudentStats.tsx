import { useState, useEffect, useCallback } from "react";
import { Users, Trophy, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StudentStat {
  user_id: string;
  name: string;
  email: string;
  total_points: number;
  level: number;
  current_streak: number;
  last_activity: string;
}

export const StudentStats = () => {
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Buscar estudantes do professor
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('user_id')
        .eq('teacher_id', user.id);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      if (!students || students.length === 0) {
        setStudentStats([]);
        return;
      }

      const userIds = students.map(s => s.user_id);

      // Buscar perfis dos estudantes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Buscar pontos dos estudantes
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, total_points, level, current_streak, last_activity_date')
        .in('user_id', userIds);

      if (pointsError) {
        console.error('Error fetching user points:', pointsError);
        return;
      }

      // Processar dados dos estudantes
      const processedStats: StudentStat[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        const points = userPoints?.find(p => p.user_id === userId);
        
        return {
          user_id: userId,
          name: profile?.name || 'Nome não informado',
          email: profile?.email || '',
          total_points: points?.total_points || 0,
          level: points?.level || 1,
          current_streak: points?.current_streak || 0,
          last_activity: points?.last_activity_date || null
        };
      });

      // Ordenar por pontos (maior para menor)
      processedStats.sort((a, b) => b.total_points - a.total_points);
      
      setStudentStats(processedStats);
      
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Setup real-time subscriptions for gamification updates
  useEffect(() => {
    if (!user?.id) return;

    const gamificationChannel = supabase
      .channel('teacher-gamification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gamification_activities'
        },
        (payload) => {
          console.log('[Real-time] New gamification activity:', payload);
          // Refresh stats when student gains points
          fetchStudentStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_points'
        },
        (payload) => {
          console.log('[Real-time] User points updated:', payload);
          // Refresh stats when student points are updated
          fetchStudentStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamificationChannel);
    };
  }, [user?.id, fetchStudentStats]);

  useEffect(() => {
    fetchStudentStats();
  }, [fetchStudentStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando estatísticas...</div>
      </div>
    );
  }

  const totalStudents = studentStats.length;
  const activeStudents = studentStats.filter(s => s.total_points > 0).length;
  const avgPoints = totalStudents > 0 ? Math.round(studentStats.reduce((sum, s) => sum + s.total_points, 0) / totalStudents) : 0;

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPoints}</div>
            <p className="text-xs text-muted-foreground">pontos</p>
          </CardContent>
        </Card>
      </div>

      {/* Students Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ranking dos Alunos</CardTitle>
          <CardDescription>Classificação por pontos de gamificação</CardDescription>
        </CardHeader>
        <CardContent>
          {studentStats.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum aluno encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {studentStats.map((student, index) => (
                <div 
                  key={student.user_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Nível {student.level}
                    </Badge>
                    <div className="text-right">
                      <p className="font-semibold">{student.total_points}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};