import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { useWeeklyFeedback } from '@/hooks/useWeeklyFeedback';
import { useFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';

export const FeedbackDebugDashboard = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, teacherId } = useActiveSubscription();
  const { 
    shouldShowModal, 
    submitWeeklyFeedback, 
    loading, 
    feedbackSettings,
    setShouldShowModal
  } = useWeeklyFeedback();

  const [testSubmitting, setTestSubmitting] = useState(false);

  const handleForceModal = () => {
    setShouldShowModal(true);
  };

  const handleTestSubmit = async () => {
    if (!teacherId) return;
    
    setTestSubmitting(true);
    try {
      const testData = {
        overallRating: 5,
        trainingRating: 5,
        dietRating: 4,
        generalFeedback: "Teste automatizado do sistema de feedback",
        trainingFeedback: "Treinos estão ótimos!",
        dietFeedback: "Dieta funcionando bem",
        questions: "Sistema funcionando perfeitamente",
        customResponses: {
          test: "Resposta de teste"
        }
      };

      const success = await submitWeeklyFeedback(testData);
      console.log('Resultado do teste:', success);
    } catch (error) {
      console.error('Erro no teste:', error);
    } finally {
      setTestSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          🧪 Debug Rápido - Sistema de Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <div className="flex items-center gap-1">
              {user ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
              <span className="text-xs">Auth</span>
            </div>
            <span className="text-xs text-muted-foreground">{user ? 'OK' : 'Erro'}</span>
          </div>
          
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <div className="flex items-center gap-1">
              {hasActiveSubscription ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
              <span className="text-xs">Assinatura</span>
            </div>
            <span className="text-xs text-muted-foreground">{hasActiveSubscription ? 'Ativa' : 'Inativa'}</span>
          </div>
          
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <div className="flex items-center gap-1">
              {teacherId ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
              <span className="text-xs">Professor</span>
            </div>
            <span className="text-xs text-muted-foreground">{teacherId ? 'OK' : 'N/A'}</span>
          </div>
          
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <div className="flex items-center gap-1">
              {feedbackSettings ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              <span className="text-xs">Config</span>
            </div>
            <span className="text-xs text-muted-foreground">{feedbackSettings ? 'OK' : 'Padrão'}</span>
          </div>
        </div>

        {/* Status do Modal */}
        <Alert className={shouldShowModal ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Modal de Feedback:</strong> {shouldShowModal ? 'Deve aparecer automaticamente' : 'Não deve aparecer hoje'}
            <br />
            <span className="text-xs text-muted-foreground">
              Configuração: {feedbackSettings?.feedback_frequency || 'weekly'} - Dias: {feedbackSettings?.feedback_days?.join(', ') || '5 (sexta)'}
            </span>
          </AlertDescription>
        </Alert>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleForceModal}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Play className="w-3 h-3 mr-1" />
            Forçar Modal
          </Button>
          
          <Button 
            onClick={handleTestSubmit}
            disabled={testSubmitting || !teacherId}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {testSubmitting ? 'Testando...' : 'Teste Rápido'}
          </Button>
          
          <Badge variant="secondary" className="text-xs">
            Professor: {teacherId ? teacherId.slice(0, 8) + '...' : 'N/A'}
          </Badge>
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Última verificação:</strong> {new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Dia da semana:</strong> {new Date().getDay()} (0=Dom, 5=Sex)</p>
          <p><strong>Status Loading:</strong> {loading ? 'Carregando' : 'Pronto'}</p>
        </div>
      </CardContent>
    </Card>
  );
};