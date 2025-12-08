/**
 * HealthDataService - Serviço para integração com Apple HealthKit (iOS) e Google Health Connect (Android)
 * BUILD 82: Dados de saúde expandidos
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

const HEALTH_PERMISSIONS: HealthPermission[] = [
    'READ_STEPS',
    'READ_WORKOUTS'
];

export class HealthDataService {
    private static instance: HealthDataService;
    private platform: 'ios' | 'android' | 'web';
    private isHealthAvailable: boolean | null = null;

    private constructor() {
        this.platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
        console.log(`[HealthDataService] Inicializado para plataforma: ${this.platform}`);
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

    async checkAvailability(): Promise<boolean> {
        if (!FEATURE_ENABLED || (this.platform !== 'ios' && this.platform !== 'android')) {
            return false;
        }
        if (this.isHealthAvailable !== null) {
            return this.isHealthAvailable;
        }
        try {
            const result = await Health.isHealthAvailable();
            this.isHealthAvailable = result.available;
            return result.available;
        } catch (error) {
            this.isHealthAvailable = false;
            return false;
        }
    }

    async requestPermissions(): Promise<HealthPermissions> {
        const defaultResult: HealthPermissions = {
            steps: 'not_determined',
            calories: 'not_determined',
            distance: 'not_determined',
            sleep: 'not_determined',
            workouts: 'not_determined',
            heartRate: 'not_determined',
            allGranted: false
        };

        if (!FEATURE_ENABLED || (this.platform !== 'ios' && this.platform !== 'android')) {
            return defaultResult;
        }

        try {
            const available = await this.checkAvailability();
            if (!available && this.platform === 'android') {
                try { await Health.showHealthConnectInPlayStore(); } catch { /* ignore */ }
                return defaultResult;
            }

            console.log('[HealthDataService] Solicitando permissões:', HEALTH_PERMISSIONS);
            const result = await Health.requestHealthPermissions({ permissions: HEALTH_PERMISSIONS });
            console.log('[HealthDataService] Resultado:', JSON.stringify(result));

            // Se não houve erro, assume que foi concedido
            return {
                steps: 'granted',
                calories: 'granted',
                distance: 'granted',
                sleep: 'not_determined',
                workouts: 'granted',
                heartRate: 'granted',
                allGranted: true
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[HealthDataService] Erro:', msg);
            throw new Error(`Falha ao solicitar permissões: ${msg}`);
        }
    }

    async getDailySteps(): Promise<number> {
        if (!FEATURE_ENABLED) return 0;
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
            console.log(`[HealthDataService] Passos: ${steps}`);
            return Math.round(steps);
        } catch (error) {
            console.error('[HealthDataService] Erro passos:', error);
            return 0;
        }
    }

    async getDailyCalories(): Promise<number> {
        if (!FEATURE_ENABLED) return 0;
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

            const result = await Health.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                dataType: 'active-calories',
                bucket: 'day'
            });

            const calories = result.aggregatedData?.[0]?.value || 0;
            console.log(`[HealthDataService] Calorias: ${calories}`);
            return Math.round(calories);
        } catch (error) {
            console.error('[HealthDataService] Erro calorias:', error);
            return 0;
        }
    }

    async getDailyWorkouts(): Promise<WorkoutData[]> {
        if (!FEATURE_ENABLED) return [];
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

            const result = await Health.queryWorkouts({
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                includeHeartRate: true,
                includeRoute: false,
                includeSteps: false
            });

            const workouts: WorkoutData[] = (result.workouts || []).map((w: any) => ({
                type: this.mapWorkoutType(w.workoutType || 'other'),
                name: w.name || 'Treino',
                startDate: new Date(w.startDate),
                endDate: new Date(w.endDate),
                durationMinutes: w.duration ? Math.round(w.duration / 60) : 0,
                caloriesBurned: w.calories || w.energyBurned,
                distanceMeters: w.distance,
                avgHeartRate: undefined,
                maxHeartRate: undefined,
                source: this.getSource()
            }));

            console.log(`[HealthDataService] Treinos: ${workouts.length}`);
            return workouts;
        } catch (error) {
            console.error('[HealthDataService] Erro treinos:', error);
            return [];
        }
    }

    private mapWorkoutType(type: string): WorkoutType {
        const map: Record<string, WorkoutType> = {
            'running': 'running', 'walking': 'walking', 'cycling': 'cycling',
            'swimming': 'swimming', 'yoga': 'yoga', 'hiit': 'hiit',
            'strength_training': 'strength_training', 'pilates': 'pilates',
            'functional_training': 'functional_training'
        };
        return map[type?.toLowerCase()] || 'other';
    }

    async getLatestHeartRate(): Promise<number | null> {
        return null; // Simplificado
    }

    async getDailyDistance(): Promise<number> {
        if (!FEATURE_ENABLED) return 0;
        try {
            const workouts = await this.getDailyWorkouts();
            return workouts.reduce((sum, w) => sum + (w.distanceMeters || 0), 0);
        } catch {
            return 0;
        }
    }

    async getDailyStats(date: Date = new Date()): Promise<DailyHealthStats> {
        try {
            const [steps, calories, workouts] = await Promise.all([
                this.getDailySteps(),
                this.getDailyCalories(),
                this.getDailyWorkouts()
            ]);

            const distance = workouts.reduce((sum, w) => sum + (w.distanceMeters || 0), 0);

            return {
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
        } catch {
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

    async getWeeklyStats(): Promise<WeeklyHealthStats> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        try {
            const [stepsResult, caloriesResult, workoutsResult] = await Promise.all([
                Health.queryAggregated({
                    startDate: oneWeekAgo.toISOString(),
                    endDate: now.toISOString(),
                    dataType: 'steps',
                    bucket: 'day'
                }).catch(() => ({ aggregatedData: [] })),
                Health.queryAggregated({
                    startDate: oneWeekAgo.toISOString(),
                    endDate: now.toISOString(),
                    dataType: 'active-calories',
                    bucket: 'day'
                }).catch(() => ({ aggregatedData: [] })),
                Health.queryWorkouts({
                    startDate: oneWeekAgo.toISOString(),
                    endDate: now.toISOString(),
                    includeHeartRate: false,
                    includeRoute: false,
                    includeSteps: false
                }).catch(() => ({ workouts: [] }))
            ]);

            const dailySteps = stepsResult.aggregatedData || [];
            const dailyCalories = caloriesResult.aggregatedData || [];
            const workouts = workoutsResult.workouts || [];

            const totalSteps = dailySteps.reduce((sum: number, d) => sum + (d.value || 0), 0);
            const totalCalories = dailyCalories.reduce((sum: number, d) => sum + (d.value || 0), 0);
            const totalDistance = workouts.reduce((sum: number, w: any) => sum + (w.distance || 0), 0);
            const daysWithData = dailySteps.filter((d) => d.value > 0).length;

            return {
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
        } catch {
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
