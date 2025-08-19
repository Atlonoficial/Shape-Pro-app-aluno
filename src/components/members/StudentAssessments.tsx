import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Activity, Ruler, Weight, ClipboardList, Heart, AlertTriangle, Pill, Moon, Bandage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStudentAssessments, Student } from '@/lib/supabase';
import { useStudentAnamnese } from '@/hooks/useStudentAnamnese';

interface StudentAssessmentsProps {
  student: any;
  onBack: () => void;
}

interface AssessmentData {
  id: string;
  date: string;
  value: number;
  unit: string;
  notes?: string;
  [key: string]: any;
}

export const StudentAssessments = ({ student, onBack }: StudentAssessmentsProps) => {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { record: anamneseRecord, loading: anamneseLoading } = useStudentAnamnese(student.user_id);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await getStudentAssessments(student.user_id);
        setAssessments(data);
      } catch (error) {
        console.error('Error fetching assessments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [student.user_id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Weight className="w-4 h-4" />;
      case 'height': return <Ruler className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const organizeAssessmentsByDate = (assessments: AssessmentData[]) => {
    const grouped = assessments.reduce((acc, assessment) => {
      const date = assessment.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(assessment);
      return acc;
    }, {} as Record<string, AssessmentData[]>);

    return Object.entries(grouped).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedAssessments = organizeAssessmentsByDate(assessments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {student.profiles?.name || 'Nome não informado'}
            </h1>
            <p className="text-sm text-muted-foreground">Avaliações Físicas</p>
          </div>
        </div>
      </div>

      {/* Current Stats */}
      {student.weight || student.height || student.body_fat || student.muscle_mass ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Dados Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {student.weight && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{student.weight} kg</p>
                  <p className="text-sm text-muted-foreground">Peso</p>
                </div>
              )}
              {student.height && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{student.height} cm</p>
                  <p className="text-sm text-muted-foreground">Altura</p>
                </div>
              )}
              {student.body_fat && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{student.body_fat}%</p>
                  <p className="text-sm text-muted-foreground">Gordura</p>
                </div>
              )}
              {student.muscle_mass && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{student.muscle_mass} kg</p>
                  <p className="text-sm text-muted-foreground">Massa Muscular</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Anamnese Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Anamnese
        </h2>

        {anamneseLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Carregando anamnese...</p>
            </CardContent>
          </Card>
        ) : !anamneseRecord ? (
          <Card>
            <CardContent className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Anamnese não preenchida pelo aluno</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Doenças */}
            {(anamneseRecord.doencas?.length > 0 || anamneseRecord.outras_doencas) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Doenças
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {anamneseRecord.doencas?.map((doenca, index) => (
                      <Badge key={index} variant="secondary" className="mr-2">
                        {doenca}
                      </Badge>
                    ))}
                    {anamneseRecord.outras_doencas && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Outras doenças:</p>
                        <p className="text-sm text-muted-foreground">{anamneseRecord.outras_doencas}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alergias */}
            {(anamneseRecord.alergias?.length > 0 || anamneseRecord.outras_alergias) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alergias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {anamneseRecord.alergias?.map((alergia, index) => (
                      <Badge key={index} variant="destructive" className="mr-2">
                        {alergia}
                      </Badge>
                    ))}
                    {anamneseRecord.outras_alergias && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Outras alergias:</p>
                        <p className="text-sm text-muted-foreground">{anamneseRecord.outras_alergias}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medicações */}
            {anamneseRecord.medicacoes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Medicações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {anamneseRecord.medicacoes.map((medicacao, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {medicacao}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sono */}
            {(anamneseRecord.horas_sono || anamneseRecord.qualidade_sono) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Sono
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {anamneseRecord.horas_sono && (
                      <div>
                        <p className="text-sm font-medium">Horas de sono:</p>
                        <p className="text-sm text-muted-foreground">{anamneseRecord.horas_sono}</p>
                      </div>
                    )}
                    {anamneseRecord.qualidade_sono && (
                      <div>
                        <p className="text-sm font-medium">Qualidade do sono:</p>
                        <p className="text-sm text-muted-foreground">{anamneseRecord.qualidade_sono}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lesões */}
            {anamneseRecord.lesoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bandage className="w-4 h-4" />
                    Lesões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{anamneseRecord.lesoes}</p>
                </CardContent>
              </Card>
            )}

            {/* Data de atualização */}
            {anamneseRecord.updated_at && (
              <div className="text-center text-xs text-muted-foreground">
                Última atualização: {new Date(anamneseRecord.updated_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessment History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Histórico de Avaliações
        </h2>

        {groupedAssessments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação registrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedAssessments.map(([date, dayAssessments]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(date)}
                    <Badge variant="secondary" className="text-xs">
                      {dayAssessments.length} medições
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {dayAssessments.map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getAssessmentIcon(assessment.type)}
                          <div>
                            <p className="font-medium capitalize">{assessment.type.replace('_', ' ')}</p>
                            {assessment.notes && (
                              <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{assessment.value} {assessment.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};