import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklyFeedback } from '@/hooks/useWeeklyFeedback';
import { useFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export const FeedbackSystemTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [testData, setTestData] = useState<any>({});

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runCompleteTest = async () => {
    setResults([]);
    setTesting(true);
    setTestData({});

    try {
      // Test 1: User Authentication
      addResult({
        name: 'Autenticação do Usuário',
        status: user ? 'success' : 'error',
        message: user ? `Usuário logado: ${user.email}` : 'Usuário não autenticado'
      });

      if (!user) {
        setTesting(false);
        return;
      }

      // Test 2: Get Teacher ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .single();

      if (studentError || !studentData) {
        addResult({
          name: 'Relacionamento Professor-Aluno',
          status: 'error',
          message: 'Não foi possível encontrar o professor do estudante'
        });
        setTesting(false);
        return;
      }

      const teacherId = studentData.teacher_id;
      setTestData(prev => ({ ...prev, teacherId }));

      addResult({
        name: 'Relacionamento Professor-Aluno',
        status: 'success',
        message: `Professor encontrado: ${teacherId}`
      });

      // Test 3: Teacher Feedback Settings (with RLS)
      const { data: settingsData, error: settingsError } = await supabase
        .from('teacher_feedback_settings')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (settingsError) {
        addResult({
          name: 'Configurações de Feedback (RLS)',
          status: 'error',
          message: `Erro ao buscar configurações: ${settingsError.message}`
        });
      } else if (settingsData) {
        addResult({
          name: 'Configurações de Feedback (RLS)',
          status: 'success',
          message: 'Configurações encontradas via RLS',
          details: settingsData
        });
        setTestData(prev => ({ ...prev, settings: settingsData }));
      } else {
        addResult({
          name: 'Configurações de Feedback (RLS)',
          status: 'warning',
          message: 'Nenhuma configuração encontrada - usando padrão'
        });
      }

      // Test 4: Check existing feedback
      const { data: existingFeedback, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('student_id', user.id)
        .eq('teacher_id', teacherId)
        .eq('type', 'periodic_feedback')
        .order('created_at', { ascending: false })
        .limit(1);

      if (feedbackError) {
        addResult({
          name: 'Verificação de Feedback Existente',
          status: 'error',
          message: `Erro ao verificar feedback: ${feedbackError.message}`
        });
      } else {
        addResult({
          name: 'Verificação de Feedback Existente',
          status: 'success',
          message: `Encontrados ${existingFeedback?.length || 0} feedbacks`,
          details: existingFeedback?.[0]
        });
        setTestData(prev => ({ ...prev, existingFeedback }));
      }

      // Test 5: Test RPC Function (simulation)
      const testFeedbackData = {
        rating: 5,
        message: 'Teste do sistema de feedback',
        metadata: {
          test: true,
          week: new Date().toISOString().split('T')[0]
        }
      };

      addResult({
        name: 'Preparação para Teste RPC',
        status: 'success',
        message: 'Dados de teste preparados',
        details: testFeedbackData
      });

      // Test 6: Check gamification integration
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        addResult({
          name: 'Sistema de Gamificação',
          status: 'error',
          message: `Erro no sistema de pontos: ${pointsError.message}`
        });
      } else {
        addResult({
          name: 'Sistema de Gamificação',
          status: 'success',
          message: pointsData ? `Pontos atuais: ${pointsData.total_points}` : 'Sistema pronto para receber pontos',
          details: pointsData
        });
      }

      // Test 7: Check if it's feedback day
      const today = new Date().getDay(); // 0 = Sunday, 5 = Friday
      const isFriday = today === 5;
      
      addResult({
        name: 'Verificação do Dia de Feedback',
        status: isFriday ? 'success' : 'warning',
        message: isFriday ? 'Hoje é sexta-feira - dia de feedback!' : `Hoje não é dia de feedback (dia ${today}, sexta é 5)`
      });

      addResult({
        name: 'Teste Completo',
        status: 'success',
        message: 'Todos os testes foram executados com sucesso!'
      });

    } catch (error) {
      console.error('Erro durante os testes:', error);
      addResult({
        name: 'Erro Geral',
        status: 'error',
        message: `Erro durante execução: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setTesting(false);
    }
  };

  // Test the actual RPC function
  const testRPCFunction = async () => {
    if (!testData.teacherId) {
      toast({
        title: "Erro",
        description: "Execute o teste completo primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      const testFeedbackData = {
        rating: 5,
        message: 'Teste real do RPC',
        metadata: {
          test: true,
          week: new Date().toISOString().split('T')[0]
        }
      };

      const { data, error } = await supabase.rpc('submit_feedback_with_points_v3', {
        p_student_id: user?.id,
        p_teacher_id: testData.teacherId,
        p_feedback_data: testFeedbackData
      });

      if (error) {
        toast({
          title: "Erro no RPC",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const result = data as any; // Type assertion for RPC response
        toast({
          title: "RPC Executado",
          description: `Resultado: ${result?.success ? 'Sucesso' : 'Falha'}`,
          variant: result?.success ? "default" : "destructive"
        });
        
        addResult({
          name: 'Teste RPC Real',
          status: result?.success ? 'success' : 'error',
          message: result?.message || 'RPC executado',
          details: result
        });
      }
    } catch (error) {
      console.error('Erro no teste RPC:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar teste RPC",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Sistema de Feedback - Verificação Completa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runCompleteTest} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {testing ? 'Testando...' : 'Executar Teste Completo'}
          </Button>
          
          {testData.teacherId && (
            <Button 
              onClick={testRPCFunction}
              variant="outline"
              className="flex items-center gap-2"
            >
              Testar RPC Real
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            {results.map((result, index) => (
              <Alert key={index} className={getStatusColor(result.status)}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.name}</h4>
                    <AlertDescription className="mt-1">
                      {result.message}
                    </AlertDescription>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Instruções:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Execute o "Teste Completo" primeiro para verificar toda a infraestrutura</li>
              <li>Se todos os testes passarem, execute "Testar RPC Real" para testar o envio</li>
              <li>Verifique se é sexta-feira para o modal aparecer automaticamente</li>
              <li>Confirme que a política RLS permite acesso às configurações</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};