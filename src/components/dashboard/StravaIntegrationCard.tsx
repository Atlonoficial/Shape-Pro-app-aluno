import { Activity, Zap, Clock, Flame, Smartphone, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStravaIntegration } from "@/hooks/useStravaIntegration";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const StravaIntegrationCard = () => {
  const { 
    connection, 
    stats, 
    loading, 
    connecting, 
    connectStrava, 
    syncData, 
    isConnected 
  } = useStravaIntegration();

  if (!isConnected) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full">
              <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Strava
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Desconectado
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Smartphone className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Conecte sua conta Strava para sincronizar automaticamente suas atividades
            </p>
            <Button 
              onClick={connectStrava}
              disabled={connecting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Conectar Strava
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full">
            <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          Strava
          {connection?.metadata?.athlete && (
            <span className="text-xs text-muted-foreground">
              • {connection.metadata.athlete.firstname}
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            Conectado
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncData}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-3 w-3 text-orange-600 dark:text-orange-400 mr-1" />
              <span className="text-xs text-muted-foreground">Distância</span>
            </div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {stats.weeklyDistance.toFixed(1)}km
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400 mr-1" />
              <span className="text-xs text-muted-foreground">Tempo</span>
            </div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {Math.floor(stats.weeklyDuration / 60)}h {stats.weeklyDuration % 60}min
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-3 w-3 text-orange-600 dark:text-orange-400 mr-1" />
              <span className="text-xs text-muted-foreground">Calorias</span>
            </div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {stats.weeklyCalorics}
            </div>
          </div>
        </div>
        
        {connection?.last_sync_at && (
          <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-800/50">
            <p className="text-xs text-muted-foreground text-center">
              Última sincronização:{' '}
              {formatDistanceToNow(new Date(connection.last_sync_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </p>
          </div>
        )}
        
        {stats.lastActivity && (
          <div className="mt-1">
            <p className="text-xs text-muted-foreground text-center">
              Última atividade:{' '}
              {formatDistanceToNow(new Date(stats.lastActivity), {
                addSuffix: true,
                locale: ptBR
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};