import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { getPlayerIdStatus } from '@/lib/oneSignalWeb';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Bell } from 'lucide-react';
import { toast } from 'sonner';

export const PlayerIdStatus = () => {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<{
    hasPlayerId: boolean;
    playerId?: string;
    loading: boolean;
  }>({ hasPlayerId: false, loading: true });

  const checkStatus = async () => {
    if (!user?.id) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await getPlayerIdStatus(user.id);
      setStatus({
        hasPlayerId: result.hasPlayerId,
        playerId: result.playerId,
        loading: false
      });
    } catch (error) {
      console.error('Error checking Player ID status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const forceSync = async () => {
    if (!user?.id) return;
    
    try {
      // Verificar se há Player ID no OneSignal
      if (window.OneSignal) {
        const playerId = await window.OneSignal.User.PushSubscription.id;
        if (playerId) {
          const { error } = await supabase
            .from('profiles')
            .update({ onesignal_player_id: playerId })
            .eq('id', user.id);
          
          if (error) {
            toast.error('Erro ao sincronizar Player ID');
          } else {
            toast.success('Player ID sincronizado com sucesso!');
            checkStatus();
          }
        } else {
          toast.error('OneSignal Player ID não encontrado');
        }
      } else {
        toast.error('OneSignal não inicializado');
      }
    } catch (error) {
      console.error('Error forcing sync:', error);
      toast.error('Erro ao forçar sincronização');
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status OneSignal</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-3">
          {status.loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : status.hasPlayerId ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          
          <Badge variant={status.hasPlayerId ? "default" : "destructive"}>
            {status.loading ? 'Verificando...' : status.hasPlayerId ? 'Sincronizado' : 'Não Sincronizado'}
          </Badge>
        </div>

        {status.playerId && (
          <p className="text-xs text-muted-foreground mb-3">
            Player ID: {status.playerId.substring(0, 8)}...
          </p>
        )}

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkStatus}
            disabled={status.loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${status.loading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceSync}
            disabled={status.loading}
          >
            Forçar Sync
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};