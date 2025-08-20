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

      console.log('🔍 Fetching weight progress for user:', userId);

      // Use SQL date functions to filter by current month (more reliable)
      const { data, error: fetchError } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'weight')
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
        .lt('date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('❌ Error fetching weight data:', fetchError);
        throw fetchError;
      }

      console.log('📊 Raw weight data from DB:', data);

      // Format data for the chart - current month only
      const formattedData = (data || []).map(entry => {
        const entryDate = new Date(entry.date);
        return {
          date: entryDate.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short' 
          }),
          weight: Number(entry.value),
          weekDay: entryDate.toLocaleDateString('pt-BR', { weekday: 'short' }),
          rawDate: entry.date // Keep original date for calculations
        };
      });

      console.log('📈 Formatted chart data:', formattedData);
      
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
      
      console.log('💾 Adding weight entry:', { userId, weight, date: today });

      const { data, error: insertError } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          type: 'weight',
          value: weight,
          unit: 'kg',
          date: today
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting weight:', insertError);
        throw insertError;
      }

      console.log('✅ Weight entry added successfully:', data);

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
      console.log('💾 Adding weight from assessment:', { userId, weight, date: assessmentDate });

      const { data, error: insertError } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          type: 'weight',
          value: weight,
          unit: 'kg',
          date: assessmentDate
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting weight from assessment:', insertError);
        throw insertError;
      }

      console.log('✅ Weight entry from assessment added successfully:', data);

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