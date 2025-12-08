/**
 * HealthDataService - Serviço para integração com Apple HealthKit (iOS) e Google Health Connect (Android)
 * 
 * @module services/HealthDataService
 * 
 * Usa o plugin capacitor-health v7 para integrar com:
 * - iOS: Apple HealthKit
 * - Android: Google Health Connect
 */

import { Capacitor } from '@capacitor/core';
import { Health } from 'capacitor-health';
import {
    DailyHealthStats,
    WeeklyHealthStats,
    HealthPermissions,
    HealthDataSource
} from '@/types/health';

/**
 * Flag para habilitar/desabilitar a feature de saúde
 * Altere para true para ativar a integração
 */
const FEATURE_ENABLED = true;

/**
 * Serviço para integração com Apple HealthKit (iOS) e Google Health Connect (Android)
 */
export class HealthDataService {
    private static instance: HealthDataService;
    private platform: 'ios' | 'android' | 'web';
    private isHealthAvailable: boolean | null = null;

    private constructor() {
        this.platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
        console.log(`[HealthDataService] Inicializado para plataforma: ${this.platform}`);
    }

    /**
     * Singleton instance
     */
    static getInstance(): HealthDataService {
        if (!HealthDataService.instance) {
            HealthDataService.instance = new HealthDataService();
        }
        return HealthDataService.instance;
    }

    /**
     * Verifica se a feature está habilitada
     */
    isFeatureEnabled(): boolean {
        return FEATURE_ENABLED;
    }

    /**
     * Verifica se a plataforma suporta dados de saúde
     */
    isSupported(): boolean {
        return FEATURE_ENABLED && (this.platform === 'ios' || this.platform === 'android');
    }

    /**
     * Retorna a fonte de dados baseada na plataforma
     */
    getSource(): HealthDataSource {
        if (this.platform === 'ios') return 'apple';
        if (this.platform === 'android') return 'google';
        return 'manual';
    }

    /**
     * Retorna nome amigável da plataforma
     */
    getPlatformName(): string {
        if (this.platform === 'ios') return 'Apple Health';
        if (this.platform === 'android') return 'Health Connect';
        return 'Não disponível';
    }

    /**
     * Verifica disponibilidade do HealthKit/Health Connect
     */
    async checkAvailability(): Promise<boolean> {
        if (!FEATURE_ENABLED) {
            console.log('[HealthDataService] Feature desabilitada');
            return false;
        }

        if (this.platform !== 'ios' && this.platform !== 'android') {
            console.log('[HealthDataService] Plataforma não suportada (web)');
            return false;
        }

        // Cache o resultado para evitar chamadas repetidas
        if (this.isHealthAvailable !== null) {
            return this.isHealthAvailable;
        }

        try {
            console.log('[HealthDataService] Verificando disponibilidade...');
            const result = await Health.isHealthAvailable();
            this.isHealthAvailable = result.available;
            console.log(`[HealthDataService] Health disponível: ${result.available}`);
            return result.available;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao verificar disponibilidade:', errorMessage);

            // Em iOS, se o HealthKit não estiver configurado no projeto, retorna erro
            // Mas ainda assim podemos tentar solicitar permissões
            this.isHealthAvailable = false;
            return false;
        }
    }

    /**
     * Solicita permissões para ler dados de saúde
     */
    async requestPermissions(): Promise<HealthPermissions> {
        console.log('[HealthDataService] Iniciando requestPermissions...');

        if (!FEATURE_ENABLED) {
            console.log('[HealthDataService] Feature desabilitada');
            return {
                steps: 'not_determined',
                heartRate: 'not_determined',
                allGranted: false
            };
        }

        if (this.platform !== 'ios' && this.platform !== 'android') {
            console.log('[HealthDataService] Plataforma não suportada');
            return {
                steps: 'not_determined',
                heartRate: 'not_determined',
                allGranted: false
            };
        }

        try {
            // Primeiro verificar se Health está disponível
            console.log('[HealthDataService] Verificando disponibilidade antes de pedir permissões...');

            let available = false;
            try {
                const availabilityResult = await Health.isHealthAvailable();
                available = availabilityResult.available;
                console.log(`[HealthDataService] isHealthAvailable: ${available}`);
            } catch (availError: unknown) {
                const errorMsg = availError instanceof Error ? availError.message : String(availError);
                console.warn('[HealthDataService] Erro ao verificar disponibilidade:', errorMsg);
                // Continua mesmo assim para iOS onde pode falhar mas ainda funcionar
            }

            if (!available && this.platform === 'android') {
                // Android: Health Connect não está instalado
                console.log('[HealthDataService] Health Connect não disponível no Android');
                // Tentar abrir Play Store
                try {
                    await Health.showHealthConnectInPlayStore();
                } catch {
                    console.log('[HealthDataService] Não foi possível abrir Play Store');
                }
                return {
                    steps: 'denied',
                    heartRate: 'denied',
                    allGranted: false
                };
            }

            // Solicitar permissões para passos
            console.log('[HealthDataService] Solicitando permissão READ_STEPS...');
            const result = await Health.requestHealthPermissions({
                permissions: ['READ_STEPS']
            });

            console.log('[HealthDataService] Resultado permissões:', JSON.stringify(result));

            // Verificar quais permissões foram concedidas
            const permissions = result.permissions || [];
            let stepsGranted = false;

            // O resultado pode vir em diferentes formatos dependendo da versão
            if (Array.isArray(permissions)) {
                stepsGranted = permissions.some((p: Record<string, boolean>) => {
                    if (typeof p === 'object' && p !== null) {
                        return p['READ_STEPS'] === true || p['steps'] === true;
                    }
                    return false;
                });
            }

            // Se não encontrou no array, verificar se veio diretamente no resultado
            // Nota: Este é um fallback para compatibilidade com diferentes versões do plugin
            if (!stepsGranted && permissions.length === 0) {
                // Assume concedido se não houve erro e não há array de permissões
                stepsGranted = true;
            }

            console.log(`[HealthDataService] Permissão de passos concedida: ${stepsGranted}`);

            return {
                steps: stepsGranted ? 'granted' : 'denied',
                heartRate: 'not_determined', // heartRate não é suportado via queryAggregated
                allGranted: stepsGranted
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';

            console.error('[HealthDataService] Erro ao solicitar permissões:', errorMessage);
            console.error('[HealthDataService] Stack:', errorStack);

            // Re-throw o erro com mensagem mais clara para a UI
            throw new Error(`Falha ao solicitar permissões: ${errorMessage}`);
        }
    }

    /**
     * Obtém a contagem de passos do dia atual
     */
    async getDailySteps(): Promise<number> {
        if (!FEATURE_ENABLED) {
            return 0;
        }

        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

            console.log('[HealthDataService] Buscando passos de', startOfDay.toISOString(), 'até', endOfDay.toISOString());

            const result = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType: 'steps',
                bucket: 'day'
            });

            const steps = result.aggregatedData?.[0]?.value || 0;
            console.log(`[HealthDataService] Passos hoje: ${steps}`);
            return Math.round(steps);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao buscar passos:', errorMessage);
            return 0;
        }
    }

    /**
     * Obtém a frequência cardíaca mais recente
     * NOTA: heartRate só está disponível via queryWorkout, não queryAggregated
     */
    async getLatestHeartRate(): Promise<number | null> {
        // heartRate não está disponível no queryAggregated deste plugin
        // Seria necessário usar queryWorkout com includeHeartRate: true
        return null;
    }

    /**
     * Obtém estatísticas diárias
     */
    async getDailyStats(date: Date = new Date()): Promise<DailyHealthStats> {
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

        try {
            const stepsResult = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType: 'steps',
                bucket: 'day'
            });

            return {
                date,
                totalSteps: Math.round(stepsResult.aggregatedData?.[0]?.value || 0),
                avgHeartRate: null, // heartRate não disponível via queryAggregated
                minHeartRate: null,
                maxHeartRate: null,
                source: this.getSource()
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao buscar stats diárias:', errorMessage);
            return {
                date,
                totalSteps: 0,
                avgHeartRate: null,
                minHeartRate: null,
                maxHeartRate: null,
                source: this.getSource()
            };
        }
    }

    /**
     * Obtém estatísticas semanais
     */
    async getWeeklyStats(): Promise<WeeklyHealthStats> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        try {
            const stepsResult = await Health.queryAggregated({
                startDate: oneWeekAgo.toISOString(),
                endDate: now.toISOString(),
                dataType: 'steps',
                bucket: 'day'
            });

            const dailySteps = stepsResult.aggregatedData || [];
            const totalSteps = dailySteps.reduce((sum: number, day) => sum + (day.value || 0), 0);
            const daysWithData = dailySteps.filter((d) => d.value > 0).length;

            return {
                avgDailySteps: daysWithData > 0 ? Math.round(totalSteps / daysWithData) : 0,
                totalSteps: Math.round(totalSteps),
                avgHeartRate: null, // heartRate não disponível via queryAggregated
                daysWithData,
                source: this.getSource()
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao buscar stats semanais:', errorMessage);
            return {
                avgDailySteps: 0,
                totalSteps: 0,
                avgHeartRate: null,
                daysWithData: 0,
                source: this.getSource()
            };
        }
    }
}

// Export singleton
export const healthDataService = HealthDataService.getInstance();
