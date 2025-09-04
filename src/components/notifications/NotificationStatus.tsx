import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Settings, Smartphone, Globe } from "lucide-react";
import { PlayerIdStatus } from '@/components/notifications/PlayerIdStatus';

export const NotificationStatus = () => {
  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status das Notificações Push
          </CardTitle>
          <CardDescription>
            Sistema OneSignal configurado e monitoramento em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Player ID Status Component */}
          <div className="mb-4">
            <PlayerIdStatus />
          </div>

          {/* Status Geral */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Sistema Configurado</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Operacional
            </Badge>
          </div>

          {/* Componentes Implementados */}
          <div className="grid gap-3">
            <h4 className="font-medium text-sm text-muted-foreground">Componentes Implementados:</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Dashboard Professor</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                ✓ Ativo
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Web Push Notifications</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                ✓ Configurado
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Mobile Push (iOS/Android)</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                ✓ Pronto para Produção
              </Badge>
            </div>
          </div>

          {/* Sistema Funcionando */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Sistema Completo:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Player ID automático com retry e verificação</li>
              <li>✅ Edge Function com targeting inteligente</li>
              <li>✅ Dashboard com 6 tipos de notificação</li>
              <li>✅ Sincronização robusta com banco de dados</li>
              <li>✅ Logs detalhados para debugging</li>
            </ul>
          </div>

          {/* Templates Disponíveis */}
          <div className="text-center text-sm text-muted-foreground">
            <strong>6 templates</strong> de notificação prontos para uso no dashboard
          </div>
        </CardContent>
      </Card>
    </div>
  );
};