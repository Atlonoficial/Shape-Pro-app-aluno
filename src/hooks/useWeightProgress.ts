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
      // Verificar se já registrou peso esta semana
      const alreadyWeighed = await hasWeighedThisWeek();
      if (alreadyWeighed) {
        setError('Você já registrou seu peso esta semana. Aguarde até a próxima sexta-feira.');
        return false;
      }

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

  const hasWeighedThisWeek = async () => {
    if (!userId) return false;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'weight')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .limit(1);

      if (error) {
        console.error('Error checking weekly weight:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error('Error in hasWeighedThisWeek:', err);
      return false;
    }
  };

  const isFridayToday = () => {
    return new Date().getDay() === 5; // 5 = Friday
  };

  const shouldShowWeightModal = async () => {
    // Verificar se já registrou peso esta semana
    const alreadyWeighed = await hasWeighedThisWeek();
    if (alreadyWeighed) return false;
    
    // Se hoje é sexta-feira, mostrar modal
    if (isFridayToday()) return true;
    
    // Se passou de sexta-feira sem registrar, mostrar na próxima entrada
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 6 = sábado
    const lastFriday = new Date(today);
    
    if (dayOfWeek === 0) { // Domingo
      lastFriday.setDate(today.getDate() - 2);
    } else if (dayOfWeek === 6) { // Sábado  
      lastFriday.setDate(today.getDate() - 1);
    } else { // Segunda a quinta
      const daysAfterFriday = dayOfWeek === 1 ? 3 : dayOfWeek === 2 ? 4 : dayOfWeek === 3 ? 5 : 6;
      lastFriday.setDate(today.getDate() - daysAfterFriday);
    }
    
    // Verificar se há registro de peso desde a última sexta-feira
    try {
      const lastFridayStr = lastFriday.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'weight')
        .gte('date', lastFridayStr)
        .limit(1);

      if (error) {
        console.error('Error checking weight since Friday:', error);
        return false;
      }

      // Se não há registro desde sexta-feira, mostrar modal
      return !data || data.length === 0;
    } catch (err) {
      console.error('Error in shouldShowWeightModal:', err);
      return false;
    }
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

  const clearError = () => {
    setError(null);
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
    clearError,
    refetch: fetchWeightProgress
  };
};