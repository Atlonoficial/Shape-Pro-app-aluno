import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Filter, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FeedbackDetailCard } from './FeedbackDetailCard';

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
            // Refresh feedbacks when updated
            fetchFeedbacks();
          }
        )
        .subscribe();

      return () => {
        console.log('[FeedbackManager] Cleaning up subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Feedbacks dos Alunos</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Feedbacks dos Alunos</h2>
            <p className="text-muted-foreground">
              {pendingCount > 0 && (
                <span className="text-orange-600 font-medium">
                  {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                </span>
              )}
              {pendingCount === 0 && "Todos os feedbacks foram respondidos"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {feedbacks.length} total
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por..." />
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
            <SelectValue placeholder="Filtrar por aluno..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os alunos</SelectItem>
            {students.map(student => (
              <SelectItem key={student.id} value={student.id}>
                {student.name || student.email}
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
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum feedback encontrado</h3>
              <p className="text-muted-foreground">
                {filter === 'pending' 
                  ? 'Não há feedbacks pendentes no momento.'
                  : filter === 'responded'
                  ? 'Não há feedbacks respondidos no momento.'
                  : 'Nenhum feedback foi recebido ainda.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map(feedback => (
            <FeedbackDetailCard
              key={feedback.id}
              feedback={feedback}
              response={responses[feedback.id] || ''}
              onResponseChange={(value) => setResponses(prev => ({ ...prev, [feedback.id]: value }))}
              onSubmitResponse={() => submitResponse(feedback.id)}
              isSubmitting={submitting === feedback.id}
            />
          ))
        )}
      </div>
    </div>
  );
};