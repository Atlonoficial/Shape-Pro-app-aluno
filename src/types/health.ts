/**
 * Tipos para integração com Apple HealthKit e Google Health Connect
 * @module types/health
 * BUILD 82: Expandido para incluir calorias, sono, distância e treinos
 */

/**
 * Fonte dos dados de saúde
 */
export type HealthDataSource = 'apple' | 'google' | 'manual';

/**
 * Tipo de treino/exercício
 */
export type WorkoutType =
    | 'running'
    | 'walking'
    | 'cycling'
    | 'swimming'
    | 'strength_training'
    | 'yoga'
    | 'hiit'
    | 'functional_training'
    | 'pilates'
    | 'other';

/**
 * Dados de um treino/exercício
 */
export interface WorkoutData {
    /** ID do treino */
    id?: string;

    /** Tipo de treino */
    type: WorkoutType;

    /** Nome do treino */
    name?: string;

    /** Data/hora de início */
    startDate: Date;

    /** Data/hora de fim */
    endDate: Date;

    /** Duração em minutos */
    durationMinutes: number;

    /** Calorias queimadas */
    caloriesBurned?: number;

    /** Distância em metros */
    distanceMeters?: number;

    /** Frequência cardíaca média */
    avgHeartRate?: number;

    /** Frequência cardíaca máxima */
    maxHeartRate?: number;

    /** Fonte dos dados */
    source: HealthDataSource;
}

/**
 * Dados de sono
 */
export interface SleepData {
    /** Data/hora de início do sono */
    startDate: Date;

    /** Data/hora de fim do sono */
    endDate: Date;

    /** Duração total em minutos */
    durationMinutes: number;

    /** Qualidade do sono (0-100) */
    quality?: number;

    /** Fonte dos dados */
    source: HealthDataSource;
}

/**
 * Dados de saúde unificados
 */
export interface HealthData {
    /** Número de passos */
    steps: number;

    /** Frequência cardíaca em BPM */
    heartRate: number | null;

    /** Calorias ativas queimadas */
    activeCalories: number;

    /** Distância percorrida em metros */
    distance: number;

    /** Data da medição */
    date: Date;

    /** Fonte dos dados */
    source: HealthDataSource;

    /** Timestamp da coleta */
    collectedAt: Date;
}

/**
 * Estatísticas diárias de saúde
 */
export interface DailyHealthStats {
    /** Data do dia */
    date: Date;

    /** Total de passos do dia */
    totalSteps: number;

    /** Calorias ativas queimadas */
    activeCalories: number;

    /** Distância percorrida em metros */
    distance: number;

    /** Tempo de sono em minutos */
    sleepMinutes: number | null;

    /** Frequência cardíaca média */
    avgHeartRate: number | null;

    /** Frequência cardíaca mínima */
    minHeartRate: number | null;

    /** Frequência cardíaca máxima */
    maxHeartRate: number | null;

    /** Treinos do dia */
    workouts: WorkoutData[];

    /** Fonte dos dados */
    source: HealthDataSource;
}

/**
 * Estatísticas semanais de saúde
 */
export interface WeeklyHealthStats {
    /** Média diária de passos */
    avgDailySteps: number;

    /** Total de passos da semana */
    totalSteps: number;

    /** Total de calorias ativas da semana */
    totalActiveCalories: number;

    /** Total de distância em metros */
    totalDistance: number;

    /** Média de sono por noite (minutos) */
    avgSleepMinutes: number | null;

    /** Frequência cardíaca média da semana */
    avgHeartRate: number | null;

    /** Total de treinos na semana */
    totalWorkouts: number;

    /** Dias com dados */
    daysWithData: number;

    /** Fonte primária dos dados */
    source: HealthDataSource;
}

/**
 * Estado de permissões do HealthKit/Health Connect
 */
export interface HealthPermissions {
    /** Permissão para ler passos */
    steps: 'granted' | 'denied' | 'not_determined';

    /** Permissão para ler calorias */
    calories: 'granted' | 'denied' | 'not_determined';

    /** Permissão para ler distância */
    distance: 'granted' | 'denied' | 'not_determined';

    /** Permissão para ler sono */
    sleep: 'granted' | 'denied' | 'not_determined';

    /** Permissão para ler treinos */
    workouts: 'granted' | 'denied' | 'not_determined';

    /** Permissão para ler frequência cardíaca */
    heartRate: 'granted' | 'denied' | 'not_determined';

    /** Todas as permissões concedidas */
    allGranted: boolean;
}

/**
 * Configuração de conexão de saúde do usuário
 */
export interface HealthConnection {
    id: string;
    userId: string;
    provider: HealthDataSource;
    isActive: boolean;
    lastSyncAt: Date | null;
    syncError: string | null;
}
