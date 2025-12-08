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

        try {
            const result = await Health.isHealthAvailable();
            console.log(`[HealthDataService] Health disponível: ${result.available}`);
            return result.available;
        } catch (error) {
            console.error('[HealthDataService] Erro ao verificar disponibilidade:', error);
            return false;
        }
    }

    /**
     * Solicita permissões para ler dados de saúde
     */
    async requestPermissions(): Promise<HealthPermissions> {
        if (!FEATURE_ENABLED) {
            return {
                steps: 'not_determined',
                heartRate: 'not_determined',
                allGranted: false
            };
        }

        try {
            // Solicitar permissões para passos (heartRate não é suportado por queryAggregated)
            const result = await Health.requestHealthPermissions({
                permissions: ['READ_STEPS']
            });

            console.log('[HealthDataService] Resultado permissões:', result);

            // Verificar quais permissões foram concedidas
            const permissions = result.permissions || [];
            const stepsGranted = permissions.some((p: Record<string, boolean>) =>
                p['READ_STEPS'] === true
            );

            return {
                steps: stepsGranted ? 'granted' : 'denied',
                heartRate: 'not_determined', // heartRate só disponível via queryWorkout
                allGranted: stepsGranted
            };
        } catch (error) {
            console.error('[HealthDataService] Erro ao solicitar permissões:', error);
            return {
                steps: 'denied',
                heartRate: 'denied',
                allGranted: false
            };
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

            const result = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType: 'steps',
                bucket: 'day'
            });

            const steps = result.aggregatedData?.[0]?.value || 0;
            console.log(`[HealthDataService] Passos hoje: ${steps}`);
            return Math.round(steps);
        } catch (error) {
            console.error('[HealthDataService] Erro ao buscar passos:', error);
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
        } catch (error) {
            console.error('[HealthDataService] Erro ao buscar stats diárias:', error);
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
        } catch (error) {
            console.error('[HealthDataService] Erro ao buscar stats semanais:', error);
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
