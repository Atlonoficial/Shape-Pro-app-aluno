/**
 * useHealthData - Hook React para dados de saúde
 * BUILD 84: Persistência de estado de conexão via Preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { healthDataService } from '@/services/HealthDataService';
import { DailyHealthStats, WeeklyHealthStats, HealthPermissions } from '@/types/health';

const STORAGE_KEY = 'health_connected';

// Estado global para evitar perda entre re-renders
let globalHealthState = {
    isConnected: false,
    permissions: null as HealthPermissions | null,
    dailyStats: null as DailyHealthStats | null,
    weeklyStats: null as WeeklyHealthStats | null,
    initialized: false
};

export const useHealthData = () => {
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);
    const [isSupported, setIsSupported] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [permissions, setPermissions] = useState<HealthPermissions | null>(globalHealthState.permissions);
    const [dailyStats, setDailyStats] = useState<DailyHealthStats | null>(globalHealthState.dailyStats);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyHealthStats | null>(globalHealthState.weeklyStats);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const initRef = useRef(false);

    const isNativePlatform = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android';

    // Carregar estado salvo e verificar suporte
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const init = async () => {
            console.log('[useHealthData] ===== INIT =====');

            const featureEnabled = healthDataService.isFeatureEnabled();
            setIsFeatureEnabled(featureEnabled);

            const supported = healthDataService.isSupported();
            setIsSupported(supported);
            console.log('[useHealthData] Suportado:', supported);

            if (!supported) return;

            // Verificar disponibilidade
            const available = await healthDataService.checkAvailability();
            setIsAvailable(available);
            console.log('[useHealthData] Disponível:', available);

            // Verificar se já estava conectado (persistido)
            try {
                const { value } = await Preferences.get({ key: STORAGE_KEY });
                console.log('[useHealthData] Estado salvo:', value);

                if (value === 'true') {
                    console.log('[useHealthData] Reconectando automaticamente...');

                    // Usar estado global se já tiver
                    if (globalHealthState.isConnected && globalHealthState.permissions) {
                        console.log('[useHealthData] Usando estado global');
                        setPermissions(globalHealthState.permissions);
                        setDailyStats(globalHealthState.dailyStats);
                        setWeeklyStats(globalHealthState.weeklyStats);
                    } else {
                        // Reconectar e buscar dados automaticamente
                        const perms: HealthPermissions = {
                            steps: 'granted',
                            calories: 'granted',
                            distance: 'granted',
                            sleep: 'not_determined',
                            workouts: 'granted',
                            heartRate: 'not_determined',
                            allGranted: true
                        };
                        setPermissions(perms);
                        globalHealthState.permissions = perms;
                        globalHealthState.isConnected = true;

                        // Buscar dados
                        try {
                            const [daily, weekly] = await Promise.all([
                                healthDataService.getDailyStats(),
                                healthDataService.getWeeklyStats()
                            ]);
                            setDailyStats(daily);
                            setWeeklyStats(weekly);
                            globalHealthState.dailyStats = daily;
                            globalHealthState.weeklyStats = weekly;
                            console.log('[useHealthData] Dados carregados automaticamente');
                        } catch (e) {
                            console.error('[useHealthData] Erro ao buscar dados:', e);
                        }
                    }
                }
            } catch (e) {
                console.error('[useHealthData] Erro ao ler estado salvo:', e);
            }
        };

        init();
    }, []);

    // Solicitar permissões
    const requestPermissions = useCallback(async () => {
        console.log('[useHealthData] requestPermissions() chamado');

        if (!isFeatureEnabled) {
            console.log('[useHealthData] Feature desabilitada');
            return false;
        }

        if (!isNativePlatform) {
            console.log('[useHealthData] Não é plataforma nativa');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const perms = await healthDataService.requestPermissions();
            console.log('[useHealthData] Permissões recebidas:', perms);
            setPermissions(perms);
            globalHealthState.permissions = perms;

            if (perms.allGranted) {
                setIsAvailable(true);
                globalHealthState.isConnected = true;

                // Salvar estado de conexão
                await Preferences.set({ key: STORAGE_KEY, value: 'true' });
                console.log('[useHealthData] Estado salvo: connected');

                // Buscar dados imediatamente
                try {
                    setLoading(true);
                    const [daily, weekly] = await Promise.all([
                        healthDataService.getDailyStats(),
                        healthDataService.getWeeklyStats()
                    ]);
                    setDailyStats(daily);
                    setWeeklyStats(weekly);
                    globalHealthState.dailyStats = daily;
                    globalHealthState.weeklyStats = weekly;
                    console.log('[useHealthData] Dados carregados:', daily);
                } catch (e) {
                    console.error('[useHealthData] Erro ao buscar dados:', e);
                }
            }

            return perms.allGranted;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error('[useHealthData] Erro:', errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isFeatureEnabled, isNativePlatform]);

    // Buscar dados (refresh manual)
    const fetchData = useCallback(async () => {
        console.log('[useHealthData] fetchData() chamado');

        if (!permissions?.allGranted) {
            console.log('[useHealthData] Sem permissões, ignorando');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [daily, weekly] = await Promise.all([
                healthDataService.getDailyStats(),
                healthDataService.getWeeklyStats()
            ]);

            setDailyStats(daily);
            setWeeklyStats(weekly);
            globalHealthState.dailyStats = daily;
            globalHealthState.weeklyStats = weekly;
            console.log('[useHealthData] Dados atualizados');
        } catch (err) {
            setError('Erro ao buscar dados de saúde');
            console.error('[useHealthData] Erro:', err);
        } finally {
            setLoading(false);
        }
    }, [permissions]);

    // Desconectar
    const disconnect = useCallback(async () => {
        await Preferences.remove({ key: STORAGE_KEY });
        setPermissions(null);
        setDailyStats(null);
        setWeeklyStats(null);
        globalHealthState = {
            isConnected: false,
            permissions: null,
            dailyStats: null,
            weeklyStats: null,
            initialized: false
        };
        console.log('[useHealthData] Desconectado');
    }, []);

    const platformName = Capacitor.getPlatform() === 'ios'
        ? 'Apple Health'
        : Capacitor.getPlatform() === 'android'
            ? 'Health Connect'
            : 'Não disponível';

    return {
        isFeatureEnabled,
        isSupported,
        isAvailable,
        isNativePlatform,
        permissions,
        dailyStats,
        weeklyStats,
        loading,
        error,
        platformName,
        requestPermissions,
        refreshData: fetchData,
        disconnect,
        isConnected: permissions?.allGranted ?? false
    };
};
