/**
 * HealthIntegrationCard - Card de integração de saúde para Dashboard
 * 
 * @module components/dashboard/HealthIntegrationCard
 * 
 * Mostra dados de passos e frequência cardíaca do Apple Health / Health Connect
 */

import { useState, useEffect } from 'react';
import { Heart, Footprints, Smartphone, Activity, RefreshCcw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHealthData } from '@/hooks/useHealthData';

export const HealthIntegrationCard = () => {
    const {
        isFeatureEnabled,
        isNativePlatform,
        isAvailable,
        isConnected,
        permissions,
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

    // Plataforma nativa - Health Connect/HealthKit não disponível
    if (!isAvailable && !loading) {
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
                        Indisponível
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-3">
                        <p className="text-xs text-muted-foreground">
                            {platformName === 'Health Connect'
                                ? 'Instale o Health Connect da Play Store para sincronizar dados de saúde'
                                : 'Ative o Apple Health nas configurações do dispositivo'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Permissões não concedidas - mostrar botão para conectar
    if (!isConnected) {
        const handleConnect = async () => {
            setIsRequesting(true);
            await requestPermissions();
            setIsRequesting(false);
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
                            disabled={isRequesting}
                            className="bg-rose-500 hover:bg-rose-600"
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
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={refreshData}
                    disabled={loading}
                >
                    <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
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

                {error && (
                    <p className="text-xs text-destructive text-center mt-2">{error}</p>
                )}
            </CardContent>
        </Card>
    );
};
