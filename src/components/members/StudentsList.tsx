import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getStudentsByTeacher, getStudentAssessments, Student } from '@/lib/supabase';
import { StudentPlanManager } from '@/components/teacher/StudentPlanManager';

interface StudentsListProps {
  onSelectStudent: (student: any) => void;
}

export const StudentsList = ({ onSelectStudent }: StudentsListProps) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentsCount, setAssessmentsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = getStudentsByTeacher(user.id, async (studentsData) => {
      setStudents(studentsData);
      
      // Fetch assessment counts for each student
      const counts: Record<string, number> = {};
      for (const student of studentsData) {
        try {
          const assessments = await getStudentAssessments(student.user_id);
          counts[student.user_id] = assessments.length;
        } catch (error) {
          console.error('Error fetching assessments for student:', error);
          counts[student.user_id] = 0;
        }
      }
      setAssessmentsCount(counts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum aluno encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Meus Alunos</h2>
        <span className="text-sm text-muted-foreground">({students.length})</span>
      </div>

      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => onSelectStudent(student)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {student.profiles?.name || 'Nome não informado'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {student.profiles?.email}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {assessmentsCount[student.user_id] || 0} avaliações
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Plano {student.active_plan || 'free'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StudentPlanManager 
                    studentId={student.user_id}
                    studentName={student.profiles?.name || 'Aluno'}
                    currentPlan={student.active_plan}
                    teacherId={user?.id || ''}
                  />
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};