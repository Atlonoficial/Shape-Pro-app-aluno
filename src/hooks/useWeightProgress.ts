import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeightEntry {
  date: string;
  weight: number;
  weekDay: string;
  rawDate: string;
}

export const useWeightProgress = (userId: string) => {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeightProgress = async () => {
    if (!userId) {
      setWeightData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get start and end of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error: fetchError } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'weight')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .order('date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Format data for the chart - current month only
      const formattedData = (data || []).map(entry => ({
        date: new Date(entry.date).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'short' 
        }),
        weight: Number(entry.value),
        weekDay: new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
        rawDate: entry.date // Keep original date for calculations
      }));
      
      setWeightData(formattedData);
    } catch (err) {
      console.error('Error fetching weight progress:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados de peso');
      setWeightData([]);
    } finally {
      setLoading(false);
    }
  };

  const addWeightEntry = async (weight: number) => {
    if (!userId) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error: insertError } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          type: 'weight',
          value: weight,
          unit: 'kg',
          date: today
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh data after adding
      await fetchWeightProgress();
      return true;
    } catch (err) {
      console.error('Error adding weight entry:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar peso');
      return false;
    }
  };

  const hasWeighedThisWeek = () => {
    if (!userId || weightData.length === 0) return false;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Check if there's any weight entry from this week
    return weightData.some(entry => {
      const entryDate = new Date(entry.rawDate);
      return entryDate >= startOfWeek;
    });
  };

  const isFridayToday = () => {
    return new Date().getDay() === 5; // 5 = Friday
  };

  const shouldShowWeightModal = () => {
    return isFridayToday() && !hasWeighedThisWeek();
  };

  const addWeightFromAssessment = async (weight: number, assessmentDate: string) => {
    if (!userId) return false;

    try {
      const { error: insertError } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          type: 'weight',
          value: weight,
          unit: 'kg',
          date: assessmentDate
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh data after adding
      await fetchWeightProgress();
      return true;
    } catch (err) {
      console.error('Error adding weight from assessment:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchWeightProgress();
  }, [userId]);

  return {
    weightData,
    loading,
    error,
    addWeightEntry,
    hasWeighedThisWeek,
    isFridayToday,
    shouldShowWeightModal,
    addWeightFromAssessment,
    refetch: fetchWeightProgress
  };
};