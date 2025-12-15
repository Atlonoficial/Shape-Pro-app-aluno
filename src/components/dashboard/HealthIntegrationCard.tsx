/**
 * HealthIntegrationCard - Card de integração de saúde para Dashboard
 * BUILD 82: UI profissional com dados expandidos
 */

import { useState } from 'react';
import { Heart, Footprints, Smartphone, Activity, RefreshCcw, AlertCircle, Flame, Route, Dumbbell } from 'lucide-react';
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

    // Web - mostrar card informativo
    if (!isNativePlatform) {
        return (
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <Activity className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        Monitoramento
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Smartphone className="h-3 w-3 mr-1" />
                        App
                    </Badge>
                </CardHeader>
                <CardContent className="pb-3">
                    <div className="text-center py-2">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                            <Footprints className="h-4 w-4 text-rose-400" />
                            <Flame className="h-4 w-4 text-orange-400" />
                            <Route className="h-4 w-4 text-blue-400" />
                            <Dumbbell className="h-4 w-4 text-purple-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Baixe o app para monitorar atividades
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
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <Heart className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        {platformName}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Em breve
                    </Badge>
                </CardHeader>
                <CardContent className="pb-3">
                    <p className="text-xs text-muted-foreground text-center">
                        Integração em desenvolvimento
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Não conectado - mostrar botão
    if (!isConnected) {
        const handleConnect = async () => {
            setIsRequesting(true);
            try {
                const success = await requestPermissions();
                if (success) {
                    toast.success('Conectado ao ' + platformName);
                } else {
                    toast.error('Não foi possível conectar. Verifique as permissões.');
                }
            } catch (err) {
                toast.error('Erro ao conectar: ' + (err as Error).message);
            } finally {
                setIsRequesting(false);
            }
        };

        return (
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <Heart className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        {platformName}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">
                            Conecte para monitorar atividades
                        </p>
                        <Button
                            size="sm"
                            onClick={handleConnect}
                            disabled={isRequesting || loading}
                            className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700 h-7 text-xs px-3"
                        >
                            {isRequesting ? 'Conectando...' : 'Conectar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- CONECTADO: MOSTRAR DADOS COMPLETOS ---
    const formatNumber = (n: number | null | undefined) => {
        if (n === null || n === undefined) return '0';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toLocaleString();
    };

    const formatDistance = (meters: number | null | undefined) => {
        if (!meters) return '0m';
        if (meters >= 1000) return (meters / 1000).toFixed(1) + 'km';
        return meters + 'm';
    };

    // Verificar se há dados reais
    const hasRealData = (dailyStats?.totalSteps ?? 0) > 0 ||
        (dailyStats?.activeCalories ?? 0) > 0 ||
        (dailyStats?.workouts?.length ?? 0) > 0;

    return (
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                        <Heart className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="truncate">{platformName}</span>
                </CardTitle>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ✓
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={refreshData}
                        disabled={loading}
                    >
                        <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                {/* Grid responsivo - 2x2 em mobile, 4x1 em telas maiores */}
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
                    {/* Passos */}
                    <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="flex justify-center mb-1">
                            <div className="p-1 sm:p-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30">
                                <Footprints className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-none">
                            {formatNumber(dailyStats?.totalSteps)}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">passos</p>
                    </div>

                    {/* Calorias */}
                    <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="flex justify-center mb-1">
                            <div className="p-1 sm:p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30">
                                <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-none">
                            {formatNumber(dailyStats?.activeCalories)}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">kcal</p>
                    </div>

                    {/* Distância */}
                    <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="flex justify-center mb-1">
                            <div className="p-1 sm:p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Route className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-none">
                            {formatDistance(dailyStats?.distance)}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">dist.</p>
                    </div>

                    {/* Treinos */}
                    <div className="text-center p-2 sm:p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="flex justify-center mb-1">
                            <div className="p-1 sm:p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-none">
                            {dailyStats?.workouts?.length || 0}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">treinos</p>
                    </div>
                </div>

                {/* Mensagem quando não há dados */}
                {!hasRealData && !loading && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                        Nenhuma atividade registrada hoje
                    </p>
                )}

                {error && (
                    <p className="text-[10px] text-destructive text-center mt-2">{error}</p>
                )}
            </CardContent>
        </Card>
    );
};

