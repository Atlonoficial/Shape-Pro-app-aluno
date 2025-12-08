/**
 * useHealthData - Hook React para dados de saúde
 * 
 * @module hooks/useHealthData
 * 
 * NOTA: A feature de saúde está marcada como "Em breve" até que
 * um plugin compatível com Capacitor esteja disponível.
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { healthDataService } from '@/services/HealthDataService';
import { DailyHealthStats, WeeklyHealthStats, HealthPermissions } from '@/types/health';

export const useHealthData = () => {
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [permissions, setPermissions] = useState<HealthPermissions | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyHealthStats | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyHealthStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verifica se é plataforma nativa (usado antes do useCallback)
    const isNativePlatform = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android';

    // Verificar suporte e disponibilidade ao montar
    useEffect(() => {
        const init = async () => {
            const featureEnabled = healthDataService.isFeatureEnabled();
            setIsFeatureEnabled(featureEnabled);

            const supported = healthDataService.isSupported();
            setIsSupported(supported);

            if (supported) {
                const available = await healthDataService.checkAvailability();
                setIsAvailable(available);
            }
        };

        init();
    }, []);

    // Solicitar permissões
    const requestPermissions = useCallback(async () => {
        if (!isFeatureEnabled) {
            console.log('[useHealthData] Feature desabilitada');
            return false;
        }

        // Na plataforma nativa, tenta solicitar permissões diretamente
        // O HealthKit/Health Connect pode não retornar "available" até permissões serem concedidas
        if (!isNativePlatform) {
            console.log('[useHealthData] Não é plataforma nativa');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const perms = await healthDataService.requestPermissions();
            setPermissions(perms);

            // Se permissões foram concedidas, atualiza isAvailable
            if (perms.allGranted) {
                setIsAvailable(true);
            }

            return perms.allGranted;
        } catch (err) {
            console.error('[useHealthData] Erro ao solicitar permissões:', err);
            setError('Erro ao solicitar permissões');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isFeatureEnabled, isNativePlatform]);

    // Buscar dados
    const fetchData = useCallback(async () => {
        if (!isFeatureEnabled || !permissions?.allGranted) {
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
        } catch (err) {
            setError('Erro ao buscar dados de saúde');
            console.error('[useHealthData] Erro:', err);
        } finally {
            setLoading(false);
        }
    }, [isFeatureEnabled, permissions]);

    // Buscar dados quando permissões forem concedidas
    useEffect(() => {
        if (permissions?.allGranted) {
            fetchData();
        }
    }, [permissions, fetchData]);

    // Nome amigável da plataforma
    const platformName = Capacitor.getPlatform() === 'ios'
        ? 'Apple Health'
        : Capacitor.getPlatform() === 'android'
            ? 'Health Connect'
            : 'Não disponível';

    return {
        // Estado
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

        // Ações
        requestPermissions,
        refreshData: fetchData,

        // Computed
        isConnected: permissions?.allGranted ?? false
    };
};
