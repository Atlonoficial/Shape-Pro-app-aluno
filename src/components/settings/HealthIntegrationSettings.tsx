/**
 * HealthIntegrationSettings - Card de configuração para integração com dados de saúde
 * 
 * @module components/settings/HealthIntegrationSettings
 * 
 * NOTA: Feature marcada como "Em breve" até plugin Capacitor compatível
 * estar disponível.
 */

import { Heart, Footprints, Smartphone, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHealthData } from '@/hooks/useHealthData';

export const HealthIntegrationSettings = () => {
    const {
        isFeatureEnabled,
        isNativePlatform,
        platformName
    } = useHealthData();

    // Em web, mostrar mensagem informativa
    if (!isNativePlatform) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-slate-400" />
                        Dados de Saúde
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Dados de saúde não estão disponíveis na versão web.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Use o app no iPhone ou Android para esta funcionalidade.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Feature desabilitada - mostrar "Em breve"
    if (!isFeatureEnabled) {
        return (
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded-full">
                            <Heart className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        {platformName}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Em breve
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-full">
                                <Footprints className="h-8 w-8 text-slate-400" />
                            </div>
                            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-full">
                                <Heart className="h-8 w-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Integração com {platformName}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Em breve você poderá conectar seu {platformName} para monitorar automaticamente seus passos e frequência cardíaca.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-left">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
                                ✨ O que você poderá fazer:
                            </p>
                            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                <li>• Contagem automática de passos diários</li>
                                <li>• Monitoramento de frequência cardíaca</li>
                                <li>• Estatísticas semanais de atividade</li>
                                <li>• Compartilhamento com seu professor</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Feature habilitada mas não conectada (código futuro)
    return (
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-600" />
                    {platformName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-6">
                    <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Conecte seu {platformName} para começar a monitorar seus dados de saúde.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
