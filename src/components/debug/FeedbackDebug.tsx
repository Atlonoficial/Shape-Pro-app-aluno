import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useWeeklyFeedback } from '@/hooks/useWeeklyFeedback';
import { WeeklyFeedbackModal } from '@/components/feedback/WeeklyFeedbackModal';
import { CheckCircle, XCircle, AlertCircle, Loader, Play, Eye } from 'lucide-react';

export const FeedbackDebug = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, teacherId } = useActiveSubscription();
  const { 
    shouldShowModal, 
    setShouldShowModal, 
    submitWeeklyFeedback, 
    loading, 
    feedbackSettings,
    getFeedbackHistory 
  } = useWeeklyFeedback();
  
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const runSystemTests = async () => {
    setTestLoading(true);
    const results: typeof testResults = [];

    try {
      // Test 1: User authentication
      if (user?.id) {
        results.push({
          test: 'Autenticação do usuário',
          status: 'success',
          message: `Usuário logado: ${user.email}`
        });
      } else {
        results.push({
          test: 'Autenticação do usuário',
          status: 'error',
          message: 'Usuário não está autenticado'
        });
      }

      // Test 2: Active subscription
      if (hasActiveSubscription) {
        results.push({
          test: 'Assinatura ativa',
          status: 'success',
          message: 'Usuário possui assinatura ativa'
        });
      } else {
        results.push({
          test: 'Assinatura ativa',
          status: 'warning',
          message: 'Usuário não possui assinatura ativa'
        });
      }

      // Test 3: Teacher relationship
      if (teacherId) {
        results.push({
          test: 'Relacionamento professor-aluno',
          status: 'success',
          message: `Vinculado ao professor: ${teacherId}`
        });
      } else {
        results.push({
          test: 'Relacionamento professor-aluno',
          status: 'error',
          message: 'Usuário não está vinculado a nenhum professor'
        });
      }

      // Test 4: Feedback settings
      if (feedbackSettings) {
        results.push({
          test: 'Configurações de feedback',
          status: 'success',
          message: `Frequência: ${feedbackSettings.feedback_frequency}, Ativo: ${feedbackSettings.is_active}`
        });
      } else {
        results.push({
          test: 'Configurações de feedback',
          status: 'warning',
          message: 'Configurações de feedback não encontradas ou não carregadas'
        });
      }

      // Test 5: RPC function
      if (user?.id && teacherId) {
        try {
          const { data: testResult, error: rpcError } = await supabase.rpc('submit_feedback_with_points_v2', {
            p_student_id: user.id,
            p_teacher_id: teacherId,
            p_feedback_data: {
              type: 'periodic_feedback',
              rating: 5,
              message: '[TESTE] Este é um feedback de teste do sistema',
              metadata: {
                test: true,
                testing_time: new Date().toISOString()
              }
            }
          });

          if (rpcError) {
            results.push({
              test: 'Função RPC de feedback',
              status: 'error',
              message: `Erro na função RPC: ${rpcError.message}`
            });
          } else if ((testResult as any)?.success) {
            results.push({
              test: 'Função RPC de feedback',
              status: 'success',
              message: `RPC funcionando. Pontos: ${(testResult as any).points_awarded || 0}`
            });
          } else if ((testResult as any)?.duplicate) {
            results.push({
              test: 'Função RPC de feedback',
              status: 'warning',
              message: 'RPC funcionando - feedback já existe para este período'
            });
          } else {
            results.push({
              test: 'Função RPC de feedback',
              status: 'error',
              message: `RPC falhou: ${(testResult as any)?.message || 'Erro desconhecido'}`
            });
          }
        } catch (error: any) {
          results.push({
            test: 'Função RPC de feedback',
            status: 'error',
            message: `Erro ao testar RPC: ${error.message}`
          });
        }
      }

      // Test 6: Database connectivity
      try {
        const { data, error } = await supabase
          .from('feedbacks')
          .select('id')
          .eq('student_id', user?.id || '')
          .limit(1);

        if (error) {
          results.push({
            test: 'Conectividade com banco',
            status: 'error',
            message: `Erro de conexão: ${error.message}`
          });
        } else {
          results.push({
            test: 'Conectividade com banco',
            status: 'success',
            message: 'Conexão com banco de dados funcionando'
          });
        }
      } catch (error: any) {
        results.push({
          test: 'Conectividade com banco',
          status: 'error',
          message: `Erro de conectividade: ${error.message}`
        });
      }

    } catch (error: any) {
      results.push({
        test: 'Sistema geral',
        status: 'error',
        message: `Erro geral nos testes: ${error.message}`
      });
    }

    setTestResults(results);
    setTestLoading(false);
  };

  const loadFeedbackHistory = async () => {
    const historyData = await getFeedbackHistory();
    setHistory(historyData);
    setShowHistory(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Debug do Sistema de Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runSystemTests} 
              disabled={testLoading}
              className="flex items-center gap-2"
            >
              {testLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {testLoading ? 'Testando...' : 'Executar Testes'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={loadFeedbackHistory}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Histórico
            </Button>

            <Button 
              variant="outline"
              onClick={() => setShowModal(true)}
            >
              Testar Modal
            </Button>
          </div>

          {/* Status atual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant={user?.id ? "default" : "destructive"}>
                {user?.id ? "Autenticado" : "Não Autenticado"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Usuário</p>
            </div>
            <div className="text-center">
              <Badge variant={hasActiveSubscription ? "default" : "destructive"}>
                {hasActiveSubscription ? "Ativo" : "Inativo"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Assinatura</p>
            </div>
            <div className="text-center">
              <Badge variant={teacherId ? "default" : "destructive"}>
                {teacherId ? "Vinculado" : "Não Vinculado"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Professor</p>
            </div>
            <div className="text-center">
              <Badge variant={shouldShowModal ? "default" : "secondary"}>
                {shouldShowModal ? "Deve Mostrar" : "Não Mostrar"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Modal</p>
            </div>
          </div>

          {/* Resultados dos testes */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Resultados dos Testes:</h3>
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.test}</p>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Histórico de feedbacks */}
          {showHistory && (
            <div className="space-y-2">
              <h3 className="font-medium">Histórico de Feedbacks ({history.length}):</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum feedback encontrado.</p>
                ) : (
                  history.map((feedback, index) => (
                    <div key={feedback.id || index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{feedback.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm font-medium">Rating: {feedback.rating}/5</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{feedback.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Configurações atuais */}
          {feedbackSettings && (
            <Alert>
              <AlertDescription>
                <strong>Configurações:</strong> Frequência: {feedbackSettings.feedback_frequency}, 
                Dias: {feedbackSettings.feedback_days.join(', ')}, 
                Ativo: {feedbackSettings.is_active ? 'Sim' : 'Não'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Modal de teste */}
      <WeeklyFeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={submitWeeklyFeedback}
        loading={loading}
        customQuestions={feedbackSettings?.custom_questions || []}
        feedbackFrequency="teste"
      />
    </div>
  );
};