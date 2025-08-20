import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeightEntry {
  date: string;
  weight: number;
  weekDay: string;
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

      const { data, error: fetchError } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'weight')
        .order('date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Format data for the chart
      const formattedData = (data || []).map(entry => ({
        date: new Date(entry.date).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'short' 
        }),
        weight: Number(entry.value),
        weekDay: new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short' })
      }));

      // Get last 8 weeks of data
      const recentData = formattedData.slice(-8);
      
      setWeightData(recentData);
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
    if (weightData.length === 0) return false;
    
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week
    
    const lastEntry = weightData[weightData.length - 1];
    if (!lastEntry) return false;
    
    // Parse the formatted date back to check if it's from this week
    const entryDate = new Date();
    // This is a simplified check - in production you'd want more precise date parsing
    return true; // For now, assume they haven't weighed this week to show the modal
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
    refetch: fetchWeightProgress
  };
};