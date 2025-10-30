import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar o modal de peso semanal
 * Detecta quando usuário perdeu a sexta-feira e deve registrar peso
 */
export const useWeeklyWeightModal = () => {
  const { user } = useAuth();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkWeightStatus = useCallback(async () => {
    if (!user?.id) {
      setShouldShowModal(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Domingo, 5 = Sexta
      
      console.log('🔍 Checking weight status for day:', dayOfWeek);

      // Verificar se já registrou peso esta semana (semana atual)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo da semana atual
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: thisWeekWeight, error: thisWeekError } = await supabase
        .from('progress')
        .select('id, date')
        .eq('user_id', user.id)
        .eq('type', 'weight')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .limit(1);

      if (thisWeekError) {
        console.error('Error checking this week weight:', thisWeekError);
        setShouldShowModal(false);
        return;
      }

      const hasWeightThisWeek = thisWeekWeight && thisWeekWeight.length > 0;

      // Se é sexta-feira e não registrou peso esta semana
      if (dayOfWeek === 5 && !hasWeightThisWeek) {
        console.log('📅 Friday and no weight this week - showing modal');
        setShouldShowModal(true);
        return;
      }

      // Se passou da sexta e não registrou peso na semana anterior
      if (dayOfWeek !== 5 && !hasWeightThisWeek) {
        const hasMissedLastWeek = await checkMissedLastWeek();
        if (hasMissedLastWeek) {
          console.log('⚠️ Missed last week weight - showing recovery modal');
          setShouldShowModal(true);
          return;
        }
      }

      setShouldShowModal(false);
    } catch (error) {
      console.error('Error in checkWeightStatus:', error);
      setShouldShowModal(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const checkMissedLastWeek = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const today = new Date();
      const dayOfWeek = today.getDay();

      // Calcular a sexta-feira da semana passada
      let daysToLastFriday = dayOfWeek + 2; // Para segunda = 3, terça = 4, etc
      if (dayOfWeek === 0) daysToLastFriday = 2; // Domingo
      if (dayOfWeek === 6) daysToLastFriday = 1; // Sábado

      const lastFriday = new Date(today);
      lastFriday.setDate(today.getDate() - daysToLastFriday);

      // Início da semana da última sexta-feira (domingo anterior)
      const lastWeekStart = new Date(lastFriday);
      lastWeekStart.setDate(lastFriday.getDate() - lastFriday.getDay());
      
      // Fim da semana da última sexta-feira (sábado)
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

      console.log('🔍 Checking last week range:', {
        start: lastWeekStart.toISOString().split('T')[0],
        end: lastWeekEnd.toISOString().split('T')[0],
        lastFriday: lastFriday.toISOString().split('T')[0]
      });

      const { data: lastWeekWeight, error } = await supabase
        .from('progress')
        .select('id, date')
        .eq('user_id', user.id)
        .eq('type', 'weight')
        .gte('date', lastWeekStart.toISOString().split('T')[0])
        .lte('date', lastWeekEnd.toISOString().split('T')[0])
        .limit(1);

      if (error) {
        console.error('Error checking last week weight:', error);
        return false;
      }

      const missedLastWeek = !lastWeekWeight || lastWeekWeight.length === 0;
      
      if (missedLastWeek) {
        console.log('❌ Missed last week weight registration');
      } else {
        console.log('✅ Found last week weight registration:', lastWeekWeight[0].date);
      }

      return missedLastWeek;
    } catch (error) {
      console.error('Error in checkMissedLastWeek:', error);
      return false;
    }
  };

  const markWeightModalDismissed = useCallback(() => {
    setShouldShowModal(false);
    // Opcionalmente, armazenar em localStorage que o modal foi dispensado hoje
    const dismissedKey = `weight_modal_dismissed_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(dismissedKey, 'true');
  }, []);

  const shouldShowModalToday = useCallback(() => {
    // Verificar se o modal foi dispensado hoje
    const dismissedKey = `weight_modal_dismissed_${new Date().toISOString().split('T')[0]}`;
    const wasDismissedToday = localStorage.getItem(dismissedKey);
    return shouldShowModal && !wasDismissedToday;
  }, [shouldShowModal]);

  // Verificar status quando o hook é inicializado
  useEffect(() => {
    checkWeightStatus();
  }, [checkWeightStatus]);

  // Verificar periodicamente se o status mudou (ex: mudou o dia)
  useEffect(() => {
    const interval = setInterval(() => {
      checkWeightStatus();
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [checkWeightStatus]);

  return {
    shouldShowModal: shouldShowModalToday(),
    loading,
    refreshStatus: checkWeightStatus,
    markDismissed: markWeightModalDismissed
  };
};