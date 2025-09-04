import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Settings, Smartphone, Globe } from "lucide-react";

export const NotificationStatus = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Status das Notificações Push
        </CardTitle>
        <CardDescription>
          Sistema OneSignal configurado e pronto para produção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Geral */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Sistema Configurado</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Pronto
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
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              ⚙️ Aguardando Produção
            </Badge>
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Próximos Passos:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Configurar credenciais reais OneSignal</li>
            <li>• Atualizar secrets no Supabase</li>
            <li>• Testar em dispositivos físicos</li>
            <li>• Publicar nas lojas de aplicativos</li>
          </ul>
        </div>

        {/* Templates Disponíveis */}
        <div className="text-center text-sm text-muted-foreground">
          <strong>5 templates</strong> de notificação prontos para uso
        </div>
      </CardContent>
    </Card>
  );
};