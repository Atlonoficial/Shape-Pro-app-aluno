import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Activity, Database, Key, Wifi } from 'lucide-react';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  secrets: {
    clientId: boolean;
    clientSecret: boolean;
  };
  message: string;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export default function StravaDebug() {
  const [loading, setLoading] = useState(false);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
    setHealthCheck(null);
  };

  const runPingTest = async () => {
    setLoading(true);
    
    addTestResult({
      name: 'Ping Test',
      status: 'pending',
      message: 'Testando conectividade básica com Edge Function...'
    });

    const startTime = Date.now();
    
    try {
      // Criar AbortController para timeout de 30s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const fetchResponse = await fetch(
          'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/strava-auth',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ping' }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }

        const data = await fetchResponse.json();

        // Validar estrutura da resposta
        if (!data || typeof data !== 'object') {
          throw new Error('Resposta inválida: não é um objeto JSON');
        }

        addTestResult({
          name: 'Ping Test',
          status: data.pong ? 'success' : 'warning',
          message: data.pong 
            ? `Conectividade OK! Latência: ${latency}ms`
            : `Resposta inesperada. Latência: ${latency}ms`,
          details: {
            ...data,
            latency: `${latency}ms`,
            status: fetchResponse.status,
            headers: Object.fromEntries(fetchResponse.headers.entries())
          }
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const latency = Date.now() - startTime;
          addTestResult({
            name: 'Ping Test',
            status: 'error',
            message: 'Timeout: Servidor não respondeu em 30 segundos',
            details: {
              latency: `${latency}ms`,
              error: 'Request timeout',
              type: 'AbortError'
            }
          });
          return;
        }

        throw fetchError;
      }
    } catch (err: any) {
      const latency = Date.now() - startTime;
      console.error('Ping test error:', err);
      addTestResult({
        name: 'Ping Test',
        status: 'error',
        message: `Falha na conectividade: ${err.message}`,
        details: {
          latency: `${latency}ms`,
          error: err.message,
          type: err.name,
          stack: err.stack
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    try {
      setLoading(true);
      clearResults();
      
      addTestResult({
        name: 'Health Check',
        status: 'pending',
        message: 'Verificando configuração dos secrets...'
      });

      // Criar AbortController para timeout de 30s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const { data, error } = await supabase.functions.invoke('strava-auth', {
          body: { action: 'health_check' }
        });

        clearTimeout(timeoutId);
        console.log('🏥 Health check response:', { data, error });

        if (error) {
          // Fallback: tentar com fetch direto
          addTestResult({
            name: 'Health Check',
            status: 'warning',
            message: 'Invoke falhou, tentando fetch direto...'
          });
          
          const fetchController = new AbortController();
          const fetchTimeoutId = setTimeout(() => fetchController.abort(), 30000);

          try {
            const fetchResponse = await fetch(
              'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/strava-auth',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'health_check' }),
                signal: fetchController.signal
              }
            );

            clearTimeout(fetchTimeoutId);

            if (!fetchResponse.ok) {
              throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
            }

            const fetchData = await fetchResponse.json();
            console.log('✅ Fetch response:', fetchData);

            // Validar estrutura da resposta
            if (!fetchData || typeof fetchData !== 'object') {
              throw new Error('Resposta inválida: não é um objeto JSON');
            }

            if (!fetchData.secrets || typeof fetchData.secrets !== 'object') {
              throw new Error('Resposta inválida: campo "secrets" ausente ou inválido');
            }

            setHealthCheck(fetchData);
            
            const secrets = fetchData.secrets as { clientId?: boolean; clientSecret?: boolean };
            
            if (secrets.clientId && secrets.clientSecret) {
              addTestResult({
                name: 'Health Check',
                status: 'success',
                message: 'Secrets OK (via fetch direto)',
                details: fetchData
              });
            } else {
              const missing = [];
              if (!secrets.clientId) missing.push('STRAVA_CLIENT_ID');
              if (!secrets.clientSecret) missing.push('STRAVA_CLIENT_SECRET');
              
              addTestResult({
                name: 'Health Check',
                status: 'warning',
                message: `Secrets faltando: ${missing.join(', ')} (via fetch direto)`,
                details: fetchData
              });
            }
            return;
          } catch (fetchError) {
            clearTimeout(fetchTimeoutId);
            
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              addTestResult({
                name: 'Health Check',
                status: 'error',
                message: 'Timeout: Servidor não respondeu em 30 segundos',
                details: 'A requisição foi cancelada por timeout. Verifique sua conexão.'
              });
              return;
            }

            throw fetchError;
          }
        }

        // Validar estrutura da resposta
        if (!data || typeof data !== 'object') {
          addTestResult({
            name: 'Health Check',
            status: 'error',
            message: 'Resposta inválida do servidor',
            details: 'A resposta não é um objeto JSON válido'
          });
          return;
        }

        if (!data.secrets || typeof data.secrets !== 'object') {
          addTestResult({
            name: 'Health Check',
            status: 'error',
            message: 'Resposta inválida: campo "secrets" ausente',
            details: data
          });
          return;
        }

        setHealthCheck(data);

        const secrets = data.secrets as { clientId?: boolean; clientSecret?: boolean };

        if (secrets.clientId && secrets.clientSecret) {
          addTestResult({
            name: 'Health Check',
            status: 'success',
            message: 'Todos os secrets estão configurados corretamente!',
            details: data
          });
        } else {
          const missing = [];
          if (!secrets.clientId) missing.push('STRAVA_CLIENT_ID');
          if (!secrets.clientSecret) missing.push('STRAVA_CLIENT_SECRET');
          
          addTestResult({
            name: 'Health Check',
            status: 'warning',
            message: `Secrets faltando: ${missing.join(', ')}`,
            details: data
          });
        }
      } catch (invokeError) {
        clearTimeout(timeoutId);
        
        if (invokeError instanceof Error && invokeError.name === 'AbortError') {
          addTestResult({
            name: 'Health Check',
            status: 'error',
            message: 'Timeout: Servidor não respondeu em 30 segundos',
            details: 'A requisição foi cancelada por timeout.'
          });
          return;
        }

        throw invokeError;
      }

    } catch (err: any) {
      console.error('❌ Health check error:', err);
      addTestResult({
        name: 'Health Check',
        status: 'error',
        message: `Exceção durante health check: ${err.message}`,
        details: err instanceof Error ? `${err.name}: ${err.message}\n${err.stack || ''}` : String(err)
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuthentication = async () => {
    try {
      setLoading(true);
      
      addTestResult({
        name: 'Autenticação',
        status: 'pending',
        message: 'Verificando sessão do usuário...'
      });

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        addTestResult({
          name: 'Autenticação',
          status: 'error',
          message: 'Usuário não autenticado',
          details: { error, user }
        });
        return;
      }

      addTestResult({
        name: 'Autenticação',
        status: 'success',
        message: `Usuário autenticado: ${user.email}`,
        details: { userId: user.id, email: user.email }
      });

    } catch (err: any) {
      addTestResult({
        name: 'Autenticação',
        status: 'error',
        message: `Erro ao verificar autenticação: ${err.message}`,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const testStravaConnection = async () => {
    try {
      setLoading(true);
      
      addTestResult({
        name: 'Conexão Strava',
        status: 'pending',
        message: 'Verificando conexão existente com Strava...'
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addTestResult({
          name: 'Conexão Strava',
          status: 'error',
          message: 'Usuário não autenticado'
        });
        return;
      }

      const { data, error } = await supabase
        .from('wearable_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'strava')
        .maybeSingle();

      if (error) {
        addTestResult({
          name: 'Conexão Strava',
          status: 'error',
          message: `Erro ao buscar conexão: ${error.message}`,
          details: error
        });
        return;
      }

      if (data) {
        addTestResult({
          name: 'Conexão Strava',
          status: 'success',
          message: `Conexão ativa encontrada. Atleta: ${data.provider_user_id}`,
          details: {
            created_at: data.created_at,
            is_active: data.is_active,
            token_expires_at: data.token_expires_at,
            last_sync_at: data.last_sync_at
          }
        });
      } else {
        addTestResult({
          name: 'Conexão Strava',
          status: 'warning',
          message: 'Nenhuma conexão com Strava encontrada',
          details: { hasConnection: false }
        });
      }

    } catch (err: any) {
      addTestResult({
        name: 'Conexão Strava',
        status: 'error',
        message: `Erro ao verificar conexão: ${err.message}`,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const testFullFlow = async () => {
    clearResults();
    await runPingTest();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testAuthentication();
    await new Promise(resolve => setTimeout(resolve, 500));
    await runHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testStravaConnection();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {status === 'success' ? 'Sucesso' : 
         status === 'error' ? 'Erro' : 
         status === 'warning' ? 'Atenção' : 
         'Processando'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Debug: Integração Strava
            </CardTitle>
            <CardDescription>
              Ferramenta de diagnóstico para identificar problemas na integração com o Strava.
              Esta página ajuda a verificar se os secrets estão configurados e se a conexão está funcionando.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={testFullFlow} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                Executar Diagnóstico Completo
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline"
                disabled={loading}
              >
                Limpar Resultados
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                onClick={runPingTest} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Ping Test
              </Button>
              <Button 
                onClick={testAuthentication} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                <Key className="h-4 w-4 mr-2" />
                Testar Auth
              </Button>
              <Button 
                onClick={runHealthCheck} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Health Check
              </Button>
              <Button 
                onClick={testStravaConnection} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Verificar Conexão
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Teste Direto POST</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-sm">Use este botão para testar se as requisições POST chegam até a Edge Function.</p>
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    addTestResult({
                      name: 'POST Debug Direto',
                      status: 'pending',
                      message: 'Enviando POST para endpoint /debug...'
                    });

                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const token = sessionData.session?.access_token;

                      if (!token) {
                        addTestResult({
                          name: 'POST Debug Direto',
                          status: 'error',
                          message: 'Token não encontrado. Faça login novamente.'
                        });
                        setLoading(false);
                        return;
                      }

                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 30000);

                      const response = await fetch(
                        'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/strava-auth',
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm9wa3F6a2F2aG1lbmpsa2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODIwNTIsImV4cCI6MjA2NTE1ODA1Mn0.Bm2Gy1vqLWexVy8EpVi-KcmRlvpZ60eO3jIiVPpJ1zE'
                          },
                          body: JSON.stringify({ action: 'debug' }),
                          signal: controller.signal
                        }
                      );

                      clearTimeout(timeoutId);

                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                      }

                      const data = await response.json();

                      addTestResult({
                        name: 'POST Debug Direto',
                        status: 'success',
                        message: '✅ POST chegou até a Edge Function!',
                        details: data
                      });
                    } catch (err: any) {
                      if (err.name === 'AbortError') {
                        addTestResult({
                          name: 'POST Debug Direto',
                          status: 'error',
                          message: 'Timeout após 30s'
                        });
                      } else {
                        addTestResult({
                          name: 'POST Debug Direto',
                          status: 'error',
                          message: `Erro: ${err.message}`,
                          details: err
                        });
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  size="sm"
                  variant="default"
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                  Testar POST Direto
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {healthCheck && (
          <Card>
            <CardHeader>
              <CardTitle>Status dos Secrets</CardTitle>
              <CardDescription>Configuração dos secrets na Edge Function</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">STRAVA_CLIENT_ID</span>
                {healthCheck.secrets.clientId ? (
                  <Badge variant="default">Configurado</Badge>
                ) : (
                  <Badge variant="destructive">Não Configurado</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">STRAVA_CLIENT_SECRET</span>
                {healthCheck.secrets.clientSecret ? (
                  <Badge variant="default">Configurado</Badge>
                ) : (
                  <Badge variant="destructive">Não Configurado</Badge>
                )}
              </div>
              <Alert variant={healthCheck.secrets.clientId && healthCheck.secrets.clientSecret ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Status Geral</AlertTitle>
                <AlertDescription>{healthCheck.message}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados dos Testes</CardTitle>
              <CardDescription>{testResults.length} teste(s) executado(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.name}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.details && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            Ver detalhes técnicos
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  {index < testResults.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Execute o <strong>Diagnóstico Completo</strong> para verificar todos os componentes</p>
            <p>2. Se os secrets não estiverem configurados, acesse o Supabase Dashboard → Edge Functions → Secrets</p>
            <p>3. Configure <code className="bg-muted px-1 rounded">STRAVA_CLIENT_ID</code> e <code className="bg-muted px-1 rounded">STRAVA_CLIENT_SECRET</code></p>
            <p>4. Execute novamente o diagnóstico para confirmar que tudo está funcionando</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
