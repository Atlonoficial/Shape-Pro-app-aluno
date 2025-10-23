import { useState } from 'react';
import { Activity, Settings, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStravaIntegration } from "@/hooks/useStravaIntegration";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const StravaIntegrationSettings = () => {
  const { 
    connection, 
    stats, 
    loading, 
    connecting, 
    connectStrava, 
    syncData, 
    disconnect,
    isConnected 
  } = useStravaIntegration();
  
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleDisconnect = async () => {
    await disconnect();
    setShowDisconnectConfirm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          Integração Strava
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Strava não conectado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte sua conta Strava para sincronizar automaticamente suas atividades de corrida, ciclismo e outros exercícios. 
              <strong className="block mt-2">Ganhe pontos automaticamente por cada atividade!</strong>
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4 text-left">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                ✨ Benefícios da integração:
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Sincronização automática de atividades</li>
                <li>• Pontos de gamificação por distância, tempo e calorias</li>
                <li>• Estatísticas semanais no dashboard</li>
                <li>• Visibilidade para seu professor</li>
              </ul>
            </div>
            <Button 
              onClick={connectStrava}
              disabled={connecting}
              className="bg-orange-600 hover:bg-orange-700 text-white w-full"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Conectando ao Strava...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Conectar conta Strava
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status da Conexão */}
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Conectado ao Strava
                  </p>
                  {connection?.metadata?.athlete && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {connection.metadata.athlete.firstname} {connection.metadata.athlete.lastname}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Ativo
              </Badge>
            </div>

            {/* Estatísticas da Semana */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.weeklyDistance.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">km esta semana</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.floor(stats.weeklyDuration / 60)}h {stats.weeklyDuration % 60}m
                </p>
                <p className="text-xs text-muted-foreground">tempo ativo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.weeklyCalorics}
                </p>
                <p className="text-xs text-muted-foreground">calorias</p>
              </div>
            </div>

            {/* Informações de Sincronização */}
            {connection?.last_sync_at && (
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Última sincronização:{' '}
                  {formatDistanceToNow(new Date(connection.last_sync_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            )}

            {/* Erro de Sincronização */}
            {connection?.sync_error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro na sincronização: {connection.sync_error}
                </AlertDescription>
              </Alert>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={syncData}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
              
              {!showDisconnectConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Confirmar
                  </Button>
                </div>
              )}
            </div>

            {/* Informações sobre Gamificação */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                🎮 Gamificação Ativa
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Cada atividade sincronizada do Strava ganha pontos automaticamente no sistema de gamificação. 
                Pontos são baseados em distância, tempo e calorias queimadas.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};