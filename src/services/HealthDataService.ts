/**
 * HealthDataService - Serviço para integração com Apple HealthKit (iOS) e Google Health Connect (Android)
 * BUILD 83: Corrigido fluxo de permissões e logging detalhado
 */

import { Capacitor } from '@capacitor/core';
import { Health, HealthPermission } from 'capacitor-health';
import {
    DailyHealthStats,
    WeeklyHealthStats,
    HealthPermissions,
    HealthDataSource,
    WorkoutData,
    WorkoutType
} from '@/types/health';

const FEATURE_ENABLED = true;

// Permissões que vamos solicitar
// Ref: https://github.com/nicoritschel/capacitor-health
// Tipos válidos: READ_STEPS, READ_WORKOUTS, READ_HEART_RATE, etc
const HEALTH_PERMISSIONS: HealthPermission[] = [
    'READ_STEPS',
    'READ_WORKOUTS'
];

export class HealthDataService {
    private static instance: HealthDataService;
    private platform: 'ios' | 'android' | 'web';
    private _isHealthAvailable: boolean | null = null;
    private _hasPermissions: boolean = false;

    private constructor() {
        this.platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
        console.log(`[HealthDataService] ===== INIT =====`);
        console.log(`[HealthDataService] Plataforma: ${this.platform}`);
        console.log(`[HealthDataService] Feature habilitada: ${FEATURE_ENABLED}`);
    }

    static getInstance(): HealthDataService {
        if (!HealthDataService.instance) {
            HealthDataService.instance = new HealthDataService();
        }
        return HealthDataService.instance;
    }

    isFeatureEnabled(): boolean {
        return FEATURE_ENABLED;
    }

    isSupported(): boolean {
        return FEATURE_ENABLED && (this.platform === 'ios' || this.platform === 'android');
    }

    getSource(): HealthDataSource {
        if (this.platform === 'ios') return 'apple';
        if (this.platform === 'android') return 'google';
        return 'manual';
    }

    getPlatformName(): string {
        if (this.platform === 'ios') return 'Apple Health';
        if (this.platform === 'android') return 'Health Connect';
        return 'Não disponível';
    }

    /**
     * Verifica se o HealthKit/Health Connect está disponível no dispositivo
     */
    async checkAvailability(): Promise<boolean> {
        console.log('[HealthDataService] checkAvailability() chamado');

        if (!FEATURE_ENABLED) {
            console.log('[HealthDataService] Feature desabilitada');
            return false;
        }

        if (this.platform !== 'ios' && this.platform !== 'android') {
            console.log('[HealthDataService] Plataforma não suportada (web)');
            return false;
        }

        if (this._isHealthAvailable !== null) {
            console.log(`[HealthDataService] Disponibilidade cacheada: ${this._isHealthAvailable}`);
            return this._isHealthAvailable;
        }

        try {
            console.log('[HealthDataService] Chamando Health.isHealthAvailable()...');
            const result = await Health.isHealthAvailable();
            console.log('[HealthDataService] Resultado isHealthAvailable:', JSON.stringify(result));
            this._isHealthAvailable = result.available;
            return result.available;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro em isHealthAvailable:', msg);
            this._isHealthAvailable = false;
            return false;
        }
    }

    /**
     * Solicita permissões para ler dados de saúde
     * IMPORTANTE: No iOS, se o usuário já respondeu, não vai re-promtar
     */
    async requestPermissions(): Promise<HealthPermissions> {
        console.log('[HealthDataService] ===== requestPermissions() =====');
        console.log('[HealthDataService] Permissões a solicitar:', HEALTH_PERMISSIONS);

        const defaultResult: HealthPermissions = {
            steps: 'not_determined',
            calories: 'not_determined',
            distance: 'not_determined',
            sleep: 'not_determined',
            workouts: 'not_determined',
            heartRate: 'not_determined',
            allGranted: false
        };

        if (!FEATURE_ENABLED) {
            console.log('[HealthDataService] Feature desabilitada');
            return defaultResult;
        }

        if (this.platform !== 'ios' && this.platform !== 'android') {
            console.log('[HealthDataService] Plataforma não suportada');
            return defaultResult;
        }

        try {
            // 1. Verificar disponibilidade primeiro
            console.log('[HealthDataService] Passo 1: Verificando disponibilidade...');
            const available = await this.checkAvailability();
            console.log(`[HealthDataService] Health disponível: ${available}`);

            // No Android, se não disponível, direciona para Play Store
            if (!available && this.platform === 'android') {
                console.log('[HealthDataService] Android: Health Connect não disponível, abrindo Play Store...');
                try {
                    await Health.showHealthConnectInPlayStore();
                } catch (e) {
                    console.warn('[HealthDataService] Erro ao abrir Play Store:', e);
                }
                return defaultResult;
            }

            // No iOS, podemos tentar mesmo se isHealthAvailable retornar false inicialmente
            // porque o HealthKit pode precisar do prompt primeiro

            // 2. Solicitar permissões
            console.log('[HealthDataService] Passo 2: Chamando Health.requestHealthPermissions()...');
            const startTime = Date.now();

            const result = await Health.requestHealthPermissions({
                permissions: HEALTH_PERMISSIONS
            });

            const elapsed = Date.now() - startTime;
            console.log(`[HealthDataService] requestHealthPermissions completou em ${elapsed}ms`);
            console.log('[HealthDataService] Resultado completo:', JSON.stringify(result, null, 2));

            // 3. Analisar resultado
            // O plugin retorna { permissions: [...] } mas o formato varia
            this._hasPermissions = true;

            // No iOS, não há como verificar se foi realmente concedido
            // O plugin assume que sim se não houve erro
            const granted: HealthPermissions = {
                steps: 'granted',
                calories: 'granted',
                distance: 'granted',
                sleep: 'not_determined',
                workouts: 'granted',
                heartRate: 'not_determined',
                allGranted: true
            };

            console.log('[HealthDataService] Permissões setadas:', granted);
            return granted;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';

            console.error('[HealthDataService] ===== ERRO EM requestPermissions =====');
            console.error('[HealthDataService] Mensagem:', errorMessage);
            console.error('[HealthDataService] Stack:', errorStack);

            // Verificar erros comuns
            if (errorMessage.includes('entitlement')) {
                console.error('[HealthDataService] ERRO DE ENTITLEMENT - Verificar configuração do Xcode/Appflow');
            }
            if (errorMessage.includes('denied')) {
                console.error('[HealthDataService] PERMISSÃO NEGADA pelo usuário');
            }

            throw new Error(`Não foi possível solicitar permissões: ${errorMessage}`);
        }
    }

    /**
     * Busca passos do dia atual
     */
    async getDailySteps(): Promise<number> {
        console.log('[HealthDataService] getDailySteps() chamado');

        if (!FEATURE_ENABLED) return 0;

        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            console.log('[HealthDataService] Buscando passos de', startOfDay.toISOString(), 'até', endOfDay.toISOString());

            const result = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType: 'steps',
                bucket: 'day'
            });

            console.log('[HealthDataService] Resultado queryAggregated steps:', JSON.stringify(result));

            const steps = result.aggregatedData?.[0]?.value || 0;
            console.log(`[HealthDataService] Passos hoje: ${steps}`);
            return Math.round(steps);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao buscar passos:', msg);
            return 0;
        }
    }

    /**
     * Busca calorias ativas do dia
     */
    async getDailyCalories(): Promise<number> {
        console.log('[HealthDataService] getDailyCalories() chamado');

        if (!FEATURE_ENABLED) return 0;

        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            const result = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType: 'active-calories',
                bucket: 'day'
            });

            console.log('[HealthDataService] Resultado queryAggregated calories:', JSON.stringify(result));

            const calories = result.aggregatedData?.[0]?.value || 0;
            console.log(`[HealthDataService] Calorias hoje: ${calories}`);
            return Math.round(calories);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao buscar calorias:', msg);
            return 0;
        }
    }

    /**
     * Busca treinos do dia
     */
    async getDailyWorkouts(): Promise<WorkoutData[]> {
        console.log('[HealthDataService] getDailyWorkouts() chamado');

        if (!FEATURE_ENABLED) return [];

        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            const result = await Health.queryWorkouts({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                includeHeartRate: true,
                includeRoute: false,
                includeSteps: false
            });

            console.log('[HealthDataService] Resultado queryWorkouts:', JSON.stringify(result));

            const workouts: WorkoutData[] = (result.workouts || []).map((w: any) => ({
                type: this.mapWorkoutType(w.workoutType || 'other'),
                name: w.name || w.workoutType || 'Treino',
                startDate: new Date(w.startDate),
                endDate: new Date(w.endDate),
                durationMinutes: w.duration ? Math.round(w.duration / 60) : 0,
                caloriesBurned: w.calories || w.energyBurned,
                distanceMeters: w.distance,
                avgHeartRate: undefined,
                maxHeartRate: undefined,
                source: this.getSource()
            }));

            console.log(`[HealthDataService] Treinos encontrados: ${workouts.length}`);
            return workouts;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro ao buscar treinos:', msg);
            return [];
        }
    }

    private mapWorkoutType(type: string): WorkoutType {
        const map: Record<string, WorkoutType> = {
            'running': 'running',
            'walking': 'walking',
            'cycling': 'cycling',
            'swimming': 'swimming',
            'yoga': 'yoga',
            'hiit': 'hiit',
            'strength_training': 'strength_training',
            'traditionalStrengthTraining': 'strength_training',
            'pilates': 'pilates',
            'functionalStrengthTraining': 'functional_training'
        };
        return map[type] || map[type?.toLowerCase()] || 'other';
    }

    async getLatestHeartRate(): Promise<number | null> {
        // Simplificado - não suportado diretamente
        return null;
    }

    async getDailyDistance(): Promise<number> {
        if (!FEATURE_ENABLED) return 0;
        try {
            const workouts = await this.getDailyWorkouts();
            const total = workouts.reduce((sum, w) => sum + (w.distanceMeters || 0), 0);
            console.log(`[HealthDataService] Distância total: ${total}m`);
            return Math.round(total);
        } catch {
            return 0;
        }
    }

    /**
     * Busca estatísticas diárias completas
     */
    async getDailyStats(date: Date = new Date()): Promise<DailyHealthStats> {
        console.log('[HealthDataService] getDailyStats() chamado');

        try {
            const [steps, calories, workouts] = await Promise.all([
                this.getDailySteps(),
                this.getDailyCalories(),
                this.getDailyWorkouts()
            ]);

            const distance = workouts.reduce((sum, w) => sum + (w.distanceMeters || 0), 0);

            const stats: DailyHealthStats = {
                date,
                totalSteps: steps,
                activeCalories: calories,
                distance: Math.round(distance),
                sleepMinutes: null,
                avgHeartRate: null,
                minHeartRate: null,
                maxHeartRate: null,
                workouts,
                source: this.getSource()
            };

            console.log('[HealthDataService] DailyStats:', JSON.stringify(stats, null, 2));
            return stats;
        } catch (error) {
            console.error('[HealthDataService] Erro em getDailyStats:', error);
            return {
                date,
                totalSteps: 0,
                activeCalories: 0,
                distance: 0,
                sleepMinutes: null,
                avgHeartRate: null,
                minHeartRate: null,
                maxHeartRate: null,
                workouts: [],
                source: this.getSource()
            };
        }
    }

    /**
     * Busca estatísticas semanais
     */
    async getWeeklyStats(): Promise<WeeklyHealthStats> {
        console.log('[HealthDataService] getWeeklyStats() chamado');

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        try {
            const [stepsResult, caloriesResult, workoutsResult] = await Promise.all([
                Health.queryAggregated({
                    startDate: oneWeekAgo.toISOString(),
                    endDate: now.toISOString(),
                    dataType: 'steps',
                    bucket: 'day'
                }).catch((e) => {
                    console.error('[HealthDataService] Erro steps semanal:', e);
                    return { aggregatedData: [] };
                }),
                Health.queryAggregated({
                    startDate: oneWeekAgo.toISOString(),
                    endDate: now.toISOString(),
                    dataType: 'active-calories',
                    bucket: 'day'
                }).catch((e) => {
                    console.error('[HealthDataService] Erro calories semanal:', e);
                    return { aggregatedData: [] };
                }),
                Health.queryWorkouts({
                    startDate: oneWeekAgo.toISOString(),
                    endDate: now.toISOString(),
                    includeHeartRate: false,
                    includeRoute: false,
                    includeSteps: false
                }).catch((e) => {
                    console.error('[HealthDataService] Erro workouts semanal:', e);
                    return { workouts: [] };
                })
            ]);

            const dailySteps = stepsResult.aggregatedData || [];
            const dailyCalories = caloriesResult.aggregatedData || [];
            const workouts = workoutsResult.workouts || [];

            const totalSteps = dailySteps.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
            const totalCalories = dailyCalories.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
            const totalDistance = workouts.reduce((sum: number, w: any) => sum + (w.distance || 0), 0);
            const daysWithData = dailySteps.filter((d: any) => d.value > 0).length;

            const stats: WeeklyHealthStats = {
                avgDailySteps: daysWithData > 0 ? Math.round(totalSteps / daysWithData) : 0,
                totalSteps: Math.round(totalSteps),
                totalActiveCalories: Math.round(totalCalories),
                totalDistance: Math.round(totalDistance),
                avgSleepMinutes: null,
                avgHeartRate: null,
                totalWorkouts: workouts.length,
                daysWithData,
                source: this.getSource()
            };

            console.log('[HealthDataService] WeeklyStats:', JSON.stringify(stats, null, 2));
            return stats;
        } catch (error) {
            console.error('[HealthDataService] Erro em getWeeklyStats:', error);
            return {
                avgDailySteps: 0,
                totalSteps: 0,
                totalActiveCalories: 0,
                totalDistance: 0,
                avgSleepMinutes: null,
                avgHeartRate: null,
                totalWorkouts: 0,
                daysWithData: 0,
                source: this.getSource()
            };
        }
    }
}

export const healthDataService = HealthDataService.getInstance();
