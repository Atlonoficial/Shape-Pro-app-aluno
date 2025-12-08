/**
 * HealthIntegrationCard - Card de integração de saúde para Dashboard
 * 
 * @module components/dashboard/HealthIntegrationCard
 * 
 * Mostra dados de passos e frequência cardíaca do Apple Health / Health Connect
 */

import { useState } from 'react';
import { Heart, Footprints, Smartphone, Activity, RefreshCcw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHealthData } from '@/hooks/useHealthData';
import { toast } from 'sonner';

export const HealthIntegrationCard = () => {
    const {
        isFeatureEnabled,
        isNativePlatform,
        isConnected,
        dailyStats,
        loading,
        error,
        platformName,
        requestPermissions,
        refreshData
    } = useHealthData();

    const [isRequesting, setIsRequesting] = useState(false);

    // Em web, mostrar card informativo
    if (!isNativePlatform) {
        return (
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        Monitoramento
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Smartphone className="h-3 w-3 mr-1" />
                        App
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-3">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="p-2 bg-rose-100/50 dark:bg-rose-800/30 rounded-full">
                                <Footprints className="h-5 w-5 text-rose-400" />
                            </div>
                            <div className="p-2 bg-rose-100/50 dark:bg-rose-800/30 rounded-full">
                                <Heart className="h-5 w-5 text-rose-400" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Baixe o app para monitorar passos e frequência cardíaca
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Feature desabilitada
    if (!isFeatureEnabled) {
        return (
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        {platformName}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Em breve
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-3">
                        <p className="text-xs text-muted-foreground">
                            Integração em desenvolvimento
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Plataforma nativa - mostrar botão para conectar ou dados se conectado
    if (!isConnected) {
        const handleConnect = async () => {
            console.log('[HealthIntegrationCard] Botão Conectar clicado');
            setIsRequesting(true);

            try {
                const success = await requestPermissions();
                console.log('[HealthIntegrationCard] Resultado:', success);

                if (success) {
                    toast.success('Conectado ao ' + platformName);
                } else {
                    toast.error('Não foi possível conectar. Verifique as permissões.');
                }
            } catch (err) {
                console.error('[HealthIntegrationCard] Erro:', err);
                toast.error('Erro ao conectar: ' + (err as Error).message);
            } finally {
                setIsRequesting(false);
            }
        };

        return (
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        {platformName}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground mb-3">
                            Conecte para monitorar passos e frequência cardíaca
                        </p>
                        <Button
                            size="sm"
                            onClick={handleConnect}
                            disabled={isRequesting || loading}
                            className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700"
                        >
                            {isRequesting ? 'Conectando...' : 'Conectar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Conectado - mostrar dados
    return (
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                        <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    {platformName}
                </CardTitle>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Conectado
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {/* Passos */}
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Footprints className="h-4 w-4 text-rose-500 mr-1" />
                            <span className="text-lg font-bold text-foreground">
                                {dailyStats?.totalSteps?.toLocaleString() || '0'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">passos hoje</p>
                    </div>

                    {/* Frequência Cardíaca */}
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Heart className="h-4 w-4 text-rose-500 mr-1" />
                            <span className="text-lg font-bold text-foreground">
                                {dailyStats?.avgHeartRate || '--'}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">bpm</span>
                        </div>
                        <p className="text-xs text-muted-foreground">média</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3"
                    onClick={refreshData}
                    disabled={loading}
                >
                    <RefreshCcw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Atualizando...' : 'Atualizar'}
                </Button>

                {error && (
                    <p className="text-xs text-destructive text-center mt-2">{error}</p>
                )}
            </CardContent>
        </Card>
    );
};
