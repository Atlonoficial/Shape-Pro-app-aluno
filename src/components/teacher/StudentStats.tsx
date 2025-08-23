import { useState, useEffect } from "react";
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
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStudentStats();
    }
  }, [user]);

  const fetchStudentStats = async () => {
    if (!user) return;

    try {
      // Buscar estudantes do professor com suas estatísticas
      const { data, error } = await supabase
        .from('students')
        .select(`
          user_id,
          profiles!inner(name, email),
          user_points(total_points, level, current_streak, last_activity_date)
        `)
        .eq('teacher_id', user.id);

      if (error) {
        console.error('Error fetching student stats:', error);
        return;
      }

      // Mapear os dados para o formato esperado
      const studentStats = data?.map((student: any) => ({
        user_id: student.user_id,
        name: student.profiles?.name || student.profiles?.email || 'Sem nome',
        email: student.profiles?.email || '',
        total_points: student.user_points?.[0]?.total_points || 0,
        level: student.user_points?.[0]?.level || 1,
        current_streak: student.user_points?.[0]?.current_streak || 0,
        last_activity: student.user_points?.[0]?.last_activity_date || null
      })) || [];

      // Ordenar por pontos
      studentStats.sort((a, b) => b.total_points - a.total_points);
      
      setStudents(studentStats);
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando estatísticas...</div>
      </div>
    );
  }

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.total_points > 0).length;
  const avgPoints = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.total_points, 0) / totalStudents) : 0;

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
          {students.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum aluno encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student, index) => (
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