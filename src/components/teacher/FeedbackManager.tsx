import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageSquare, Calendar, User, Send, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Feedback {
  id: string;
  student_id: string;
  rating: number;
  message: string;
  created_at: string;
  type: string;
  related_item_id: string | null;
  metadata: any;
  student_name?: string;
  student_email?: string;
  teacher_response?: string;
  responded_at?: string;
}

export const FeedbackManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Fetch feedbacks from students with real-time updates
  const fetchFeedbacks = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('[FeedbackManager] Fetching feedbacks for teacher:', user.id);
      
      // Get feedbacks with student info - include periodic_feedback
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          id,
          student_id,
          rating,
          message,
          created_at,
          type,
          related_item_id,
          metadata,
          teacher_response,
          responded_at
        `)
        .eq('teacher_id', user.id)
        .in('type', ['weekly_feedback', 'periodic_feedback'])
        .order('created_at', { ascending: false })
        .limit(50); // Limit to most recent 50 feedbacks

      if (error) {
        console.error('[FeedbackManager] Error fetching feedbacks:', error);
        throw error;
      }

      console.log('[FeedbackManager] Found feedbacks:', data?.length || 0);

      // Get student profiles separately
      const studentIds = [...new Set((data || []).map(f => f.student_id))];
      if (studentIds.length === 0) {
        setFeedbacks([]);
        setStudents([]);
        return;
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', studentIds);

      if (studentsError) {
        console.error('[FeedbackManager] Error fetching students:', studentsError);
      }

      const studentsMap = (studentsData || []).reduce((acc, student) => {
        acc[student.id] = student;
        return acc;
      }, {} as Record<string, any>);

      const feedbacksWithStudentInfo = (data || []).map(feedback => ({
        ...feedback,
        student_name: studentsMap[feedback.student_id]?.name || 'Aluno',
        student_email: studentsMap[feedback.student_id]?.email || ''
      }));

      setFeedbacks(feedbacksWithStudentInfo);
      console.log('[FeedbackManager] Processed feedbacks:', feedbacksWithStudentInfo.length);

      // Get unique students for filter
      const uniqueStudents = feedbacksWithStudentInfo.reduce((acc, feedback) => {
        if (!acc.find(s => s.id === feedback.student_id)) {
          acc.push({
            id: feedback.student_id,
            name: feedback.student_name || 'Aluno',
            email: feedback.student_email || ''
          });
        }
        return acc;
      }, [] as Array<{ id: string; name: string; email: string }>);

      setStudents(uniqueStudents);
    } catch (error) {
      console.error('[FeedbackManager] Error fetching feedbacks:', error);
      toast({
        title: "Erro ao carregar feedbacks",
        description: "Não foi possível carregar os feedbacks dos alunos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit response to feedback
  const submitResponse = async (feedbackId: string) => {
    const response = responses[feedbackId];
    if (!response?.trim()) return;

    try {
      setSubmitting(feedbackId);
      
      const { error } = await supabase
        .from('feedbacks')
        .update({
          teacher_response: response.trim(),
          responded_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: "Resposta enviada!",
        description: "Sua resposta foi enviada ao aluno.",
      });

      // Clear response text and refresh
      setResponses(prev => ({ ...prev, [feedbackId]: '' }));
      await fetchFeedbacks();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Erro ao enviar resposta",
        description: "Não foi possível enviar a resposta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(null);
    }
  };

  // Filter feedbacks based on selected filters
  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (filter === 'pending' && feedback.teacher_response) return false;
    if (filter === 'responded' && !feedback.teacher_response) return false;
    if (selectedStudent !== 'all' && feedback.student_id !== selectedStudent) return false;
    return true;
  });

  const pendingCount = feedbacks.filter(f => !f.teacher_response).length;

  useEffect(() => {
    fetchFeedbacks();

    // Set up real-time subscription for new feedbacks
    if (user?.id) {
      console.log('[FeedbackManager] Setting up real-time subscription');
      
      const channel = supabase
        .channel('teacher-feedbacks')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'feedbacks',
            filter: `teacher_id=eq.${user.id}`
          },
          (payload) => {
            console.log('[FeedbackManager] New feedback received:', payload.new);
            
            // Show notification for new feedback
            toast({
              title: "Novo feedback recebido!",
              description: "Um aluno enviou um novo feedback.",
              variant: "default"
            });
            
            // Refresh feedbacks
            fetchFeedbacks();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'feedbacks',
            filter: `teacher_id=eq.${user.id}`
          },
          (payload) => {
            console.log('[FeedbackManager] Feedback updated:', payload.new);
            
            // If teacher response was updated, refresh
            if (payload.new.teacher_response !== payload.old.teacher_response) {
              fetchFeedbacks();
            }
          }
        )
        .subscribe();

      return () => {
        console.log('[FeedbackManager] Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const getWeekFromMetadata = (metadata: any): string => {
    if (metadata?.week && metadata?.year) {
      return `Semana ${metadata.week}/${metadata.year}`;
    }
    if (metadata?.frequency) {
      const frequencyMap = {
        'daily': 'Feedback Diário',
        'weekly': 'Feedback Semanal',
        'biweekly': 'Feedback Quinzenal',
        'monthly': 'Feedback Mensal'
      };
      return frequencyMap[metadata.frequency as keyof typeof frequencyMap] || 'Feedback Periódico';
    }
    return 'Feedback Periódico';
  };

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feedbacks dos Alunos</h2>
          <p className="text-muted-foreground">Gerencie os feedbacks semanais dos seus alunos</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="responded">Respondidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-[200px]">
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

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">Nenhum feedback encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'pending' 
                  ? 'Não há feedbacks pendentes no momento.'
                  : 'Não há feedbacks para os filtros selecionados.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className={!feedback.teacher_response ? 'border-warning/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {feedback.student_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(feedback.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div>{getWeekFromMetadata(feedback.metadata)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StarDisplay rating={feedback.rating} />
                    {!feedback.teacher_response && (
                      <Badge variant="destructive" className="text-xs">
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Ratings from metadata */}
                {feedback.metadata && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Treinos</p>
                      <StarDisplay rating={feedback.metadata.training_rating || 0} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Alimentação</p>
                      <StarDisplay rating={feedback.metadata.diet_rating || 0} />
                    </div>
                  </div>
                )}

                {/* Feedback Message */}
                <div>
                  <p className="text-sm font-medium mb-2">Feedback Geral:</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{feedback.message}</p>
                </div>

                {/* Additional feedback from metadata */}
                {feedback.metadata?.training_feedback && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sobre os Treinos:</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{feedback.metadata.training_feedback}</p>
                  </div>
                )}

                {feedback.metadata?.diet_feedback && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sobre a Alimentação:</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{feedback.metadata.diet_feedback}</p>
                  </div>
                )}

                {feedback.metadata?.questions && (
                  <div>
                    <p className="text-sm font-medium mb-2">Dúvidas/Perguntas:</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{feedback.metadata.questions}</p>
                  </div>
                )}

                {/* Teacher Response */}
                {feedback.teacher_response ? (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Sua Resposta:</p>
                      <span className="text-xs text-muted-foreground">
                        em {format(new Date(feedback.responded_at!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                      <p className="text-sm">{feedback.teacher_response}</p>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Responder ao aluno:</p>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Digite sua resposta para o aluno..."
                        value={responses[feedback.id] || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                        className="min-h-[80px]"
                      />
                      <Button
                        onClick={() => submitResponse(feedback.id)}
                        disabled={!responses[feedback.id]?.trim() || submitting === feedback.id}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {submitting === feedback.id ? 'Enviando...' : 'Enviar Resposta'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};