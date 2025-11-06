import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Lock, Unlock, User } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  is_free: boolean;
  module_id: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface LessonAccess {
  lesson_id: string;
  student_id: string;
  granted_at: string;
  notes?: string;
}

export const LessonAccessManager = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessonAccess, setLessonAccess] = useState<LessonAccess[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch lessons from courses owned by the teacher
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor', user.id);

      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map(c => c.id);

        // Fetch modules from those courses
        const { data: modulesData } = await supabase
          .from('course_modules')
          .select('id')
          .in('course_id', courseIds);

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id);

          // Fetch lessons from those modules
          const { data: lessonsData } = await supabase
            .from('course_lessons')
            .select('id, title, is_free, module_id')
            .in('module_id', moduleIds)
            .order('order_index');

          setLessons((lessonsData as any) || []);
        }
      }

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('teacher_id', user.id);

      const formattedStudents = studentsData?.map((s: any) => ({
        id: s.user_id,
        name: s.profiles?.full_name || 'Sem nome',
        email: s.profiles?.email || ''
      })) || [];

      setStudents(formattedStudents);

      // Fetch lesson access
      const { data: accessData } = await supabase
        .from('lesson_access')
        .select('*')
        .eq('granted_by', user.id);

      setLessonAccess((accessData as any) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const grantAccess = async (lessonId: string, studentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lesson_access')
        .insert({
          lesson_id: lessonId,
          student_id: studentId,
          granted_by: user.id,
          notes: 'Acesso liberado manualmente pelo professor'
        });

      if (error) throw error;

      toast.success('Acesso liberado com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Error granting access:', error);
      if (error.code === '23505') {
        toast.error('Aluno já possui acesso a esta aula');
      } else {
        toast.error('Erro ao liberar acesso');
      }
    }
  };

  const revokeAccess = async (lessonId: string, studentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lesson_access')
        .delete()
        .eq('lesson_id', lessonId)
        .eq('student_id', studentId)
        .eq('granted_by', user.id);

      if (error) throw error;

      toast.success('Acesso revogado com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Erro ao revogar acesso');
    }
  };

  const hasAccess = (lessonId: string, studentId: string) => {
    return lessonAccess.some(
      a => a.lesson_id === lessonId && a.student_id === studentId
    );
  };

  const getStudentsWithAccess = (lessonId: string) => {
    return lessonAccess
      .filter(a => a.lesson_id === lessonId)
      .map(a => students.find(s => s.id === a.student_id))
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Acesso às Aulas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Libere aulas específicas para alunos individuais
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Filtrar por Aluno</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os alunos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os alunos</SelectItem>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma aula encontrada. Crie cursos e aulas primeiro.
            </p>
          ) : (
            lessons.map(lesson => {
              const studentsWithAccess = getStudentsWithAccess(lesson.id);
              const filteredStudents = selectedStudent && selectedStudent !== 'all'
                ? students.filter(s => s.id === selectedStudent)
                : students;

              return (
                <Card key={lesson.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Lesson Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{lesson.title}</h4>
                          <Badge 
                            variant={lesson.is_free ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {lesson.is_free ? '🎓 Aula Introdutória' : '🔒 Aula Premium'}
                          </Badge>
                        </div>
                      </div>

                      {/* Students with Access */}
                      {studentsWithAccess.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Alunos com acesso manual:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {studentsWithAccess.map((student: any) => (
                              <Badge 
                                key={student.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {student.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Access Controls */}
                      {!lesson.is_free && (
                        <div className="space-y-2 pt-2 border-t">
                          {filteredStudents.map(student => {
                            const studentHasAccess = hasAccess(lesson.id, student.id);

                            return (
                              <div 
                                key={student.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{student.name}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant={studentHasAccess ? 'destructive' : 'default'}
                                  onClick={() => 
                                    studentHasAccess
                                      ? revokeAccess(lesson.id, student.id)
                                      : grantAccess(lesson.id, student.id)
                                  }
                                >
                                  {studentHasAccess ? (
                                    <>
                                      <Lock className="w-3 h-3 mr-1" />
                                      Revogar
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3 h-3 mr-1" />
                                      Liberar
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
