import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Bug
} from 'lucide-react';
import { useMealLogDiagnostics } from '@/hooks/useMealLogDiagnostics';
import { useMealPlans } from '@/hooks/useMealPlans';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MealLogDiagnostics: React.FC = () => {
  const { diagnostics, stats, validateMealIds, testMealLogCreation } = useMealLogDiagnostics();
  const { currentPlan } = useMealPlans();
  const [validation, setValidation] = React.useState<any>(null);

  const handleValidatePlan = async () => {
    if (currentPlan) {
      const result = await validateMealIds(currentPlan);
      setValidation(result);
    }
  };

  const handleTestMeal = async (mealId: string) => {
    await testMealLogCreation(mealId);
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Tentativas</p>
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Sucessos</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Falhas</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Taxa Sucesso</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Validação do Plano Atual
          </CardTitle>
          <CardDescription>
            Verificar se os IDs das refeições estão no formato correto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleValidatePlan} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Validar Plano Atual
            </Button>

            {validation && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>IDs Válidos:</span>
                  <Badge variant="outline" className="text-green-600">
                    {validation.valid}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>IDs Inválidos:</span>
                  <Badge variant="outline" className="text-red-600">
                    {validation.invalid}
                  </Badge>
                </div>

                {validation.issues.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Detalhes:</h4>
                    <ScrollArea className="h-32">
                      {validation.issues.map((issue: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded mb-1">
                          <div className="flex items-center justify-between">
                            <span>Original: {issue.mealId}</span>
                            {issue.isValid ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          {!issue.isValid && (
                            <div className="text-muted-foreground">
                              Convertido: {issue.convertedId}
                            </div>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle>Logs Recentes</CardTitle>
          <CardDescription>
            Últimas tentativas de registro de refeições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {diagnostics.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum log disponível ainda
              </p>
            ) : (
              <div className="space-y-2">
                {diagnostics.map((diagnostic, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        {diagnostic.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {diagnostic.action.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(diagnostic.timestamp), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div>ID: {diagnostic.mealId}</div>
                        {diagnostic.mealId !== diagnostic.validMealId && (
                          <div className="text-muted-foreground">
                            → {diagnostic.validMealId}
                          </div>
                        )}
                      </div>
                    </div>
                    {diagnostic.error && (
                      <div className="text-xs text-red-600 px-2 pb-2">
                        Erro: {diagnostic.error}
                      </div>
                    )}
                    {index < diagnostics.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};