/**
 * Tipos para integração com Apple HealthKit e Google Health Connect
 * @module types/health
 */

/**
 * Fonte dos dados de saúde
 */
export type HealthDataSource = 'apple' | 'google' | 'manual';

/**
 * Dados de saúde unificados
 */
export interface HealthData {
    /** Número de passos */
    steps: number;

    /** Frequência cardíaca em BPM */
    heartRate: number | null;

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

    /** Frequência cardíaca média */
    avgHeartRate: number | null;

    /** Frequência cardíaca mínima */
    minHeartRate: number | null;

    /** Frequência cardíaca máxima */
    maxHeartRate: number | null;

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

    /** Frequência cardíaca média da semana */
    avgHeartRate: number | null;

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
