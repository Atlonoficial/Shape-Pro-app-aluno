import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bell, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export const NotificationDebug = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkOneSignalSetup = async () => {
    setLoading(true);
    try {
      // 1. Check profile player_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('onesignal_player_id, user_type')
        .eq('id', user?.id)
        .single();

      // 2. Check notification preferences
      const { data: settings } = await supabase
        .from('user_settings')
        .select('push_notifications')
        .eq('user_id', user?.id)
        .maybeSingle();

      // 3. Count recent notifications
      const { data: recentNotifications } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', user?.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const recentCount = recentNotifications?.length || 0;

      // 4. Check OneSignal browser permission
      const browserPermission = typeof Notification !== 'undefined' 
        ? Notification.permission 
        : 'unsupported';

      setDebugInfo({
        profile: {
          hasPlayerId: !!profile?.onesignal_player_id,
          playerId: profile?.onesignal_player_id || 'NOT SET',
          userType: profile?.user_type
        },
        settings: {
          pushEnabled: settings?.push_notifications ?? true
        },
        notifications: {
          recentCount
        },
        browser: {
          permission: browserPermission,
          supported: typeof Notification !== 'undefined'
        },
        oneSignal: {
          pluginLoaded: typeof (window as any).plugins?.OneSignal !== 'undefined',
          isMobile: !!(window as any).plugins?.OneSignal
        }
      });

      toast.success('Debug info carregado');
    } catch (error: any) {
      console.error('Error checking OneSignal setup:', error);
      toast.error('Erro ao carregar debug info');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '🔔 Teste de Notificação',
          message: `Teste enviado em ${new Date().toLocaleTimeString('pt-BR')}`,
          target_users: [user.id],
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Test notification error:', error);
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.success(`Notificação enviada! Recipients: ${data?.recipients || 0}`);
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast.error('Erro ao enviar notificação teste');
    } finally {
      setLoading(false);
      // Reload debug info
      setTimeout(() => checkOneSignalSetup(), 1000);
    }
  };

  const StatusBadge = ({ condition, trueText, falseText }: any) => (
    <Badge variant={condition ? "default" : "destructive"} className="gap-1">
      {condition ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {condition ? trueText : falseText}
    </Badge>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          OneSignal Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkOneSignalSetup} 
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verificar Setup
          </Button>
          <Button 
            onClick={sendTestNotification} 
            disabled={loading || !debugInfo?.profile?.hasPlayerId}
            className="flex-1"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enviar Teste
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-3 text-sm">
            {/* Profile Status */}
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Status do Perfil
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Player ID:</span>
                  <StatusBadge 
                    condition={debugInfo.profile.hasPlayerId}
                    trueText="Configurado"
                    falseText="NÃO Configurado"
                  />
                </div>
                {debugInfo.profile.hasPlayerId && (
                  <div className="text-xs text-muted-foreground font-mono break-all">
                    {debugInfo.profile.playerId}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="outline">{debugInfo.profile.userType}</Badge>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2">Configurações</h4>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Push Notifications:</span>
                <StatusBadge 
                  condition={debugInfo.settings.pushEnabled}
                  trueText="Habilitado"
                  falseText="Desabilitado"
                />
              </div>
            </div>

            {/* Browser Support */}
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2">Navegador</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Permissão:</span>
                  <Badge variant={
                    debugInfo.browser.permission === 'granted' ? 'default' :
                    debugInfo.browser.permission === 'denied' ? 'destructive' : 'outline'
                  }>
                    {debugInfo.browser.permission}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Suportado:</span>
                  <StatusBadge 
                    condition={debugInfo.browser.supported}
                    trueText="Sim"
                    falseText="Não"
                  />
                </div>
              </div>
            </div>

            {/* OneSignal Plugin */}
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2">OneSignal Plugin</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plugin Carregado:</span>
                  <StatusBadge 
                    condition={debugInfo.oneSignal.pluginLoaded}
                    trueText="Sim"
                    falseText="Não"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modo:</span>
                  <Badge variant="outline">
                    {debugInfo.oneSignal.isMobile ? 'Mobile' : 'Web'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2">Notificações (24h)</h4>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Recebido:</span>
                <Badge variant="outline">{debugInfo.notifications.recentCount}</Badge>
              </div>
            </div>

            {/* Recommendations */}
            {(!debugInfo.profile.hasPlayerId || debugInfo.browser.permission !== 'granted') && (
              <div className="p-3 rounded-lg border border-orange-500/50 bg-orange-500/10">
                <h4 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">
                  ⚠️ Ações Recomendadas
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  {!debugInfo.profile.hasPlayerId && (
                    <li>Fazer logout e login novamente para registrar Player ID</li>
                  )}
                  {debugInfo.browser.permission !== 'granted' && (
                    <li>Permitir notificações no navegador quando solicitado</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
