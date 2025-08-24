import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, BookOpen, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UnlockRequest {
  id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student_name: string;
  student_email: string;
  course_title: string;
  course_price: number;
}

export const UnlockRequestsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<UnlockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_unlock_requests')
        .select(`
          id,
          student_id,
          course_id,
          status,
          created_at,
          profiles!course_unlock_requests_student_id_fkey(name, email),
          courses!course_unlock_requests_course_id_fkey(title, price)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = data?.map((req: any) => ({
        id: req.id,
        student_id: req.student_id,
        course_id: req.course_id,
        status: req.status,
        created_at: req.created_at,
        student_name: req.profiles?.name || req.profiles?.email || 'Estudante',
        student_email: req.profiles?.email || '',
        course_title: req.courses?.title || 'Curso',
        course_price: req.courses?.price || 0
      })) || [];

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching unlock requests:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('course_unlock_requests')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, could add to user_purchases table here
      if (action === 'approved') {
        // This would typically be done after payment processing
        // For now, just update the request status
      }

      toast({
        title: action === 'approved' ? "Aprovado!" : "Rejeitado",
        description: `Solicitação ${action === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar solicitação",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Solicitações Pendentes ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma solicitação pendente
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{request.student_name}</span>
                        <span className="text-sm text-muted-foreground">({request.student_email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{request.course_title}</span>
                        <Badge variant="secondary">R$ {request.course_price}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestAction(request.id, 'rejected')}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestAction(request.id, 'approved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{request.student_name}</p>
                      <p className="text-sm text-muted-foreground">{request.course_title}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={request.status === 'approved' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};