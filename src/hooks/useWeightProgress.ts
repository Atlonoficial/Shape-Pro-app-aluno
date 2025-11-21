import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFridayOfWeek } from '@/utils/dateHelpers';
import { retryWithBackoff } from '@/utils/retryWithBackoff';

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

  // Helper function that performs the actual weight entry logic
  const performWeightEntry = async (weight: number) => {
    console.log('🔍 Starting weight entry process for userId:', userId);
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Dom, 5=Sex, 6=Sáb
    
    // ✅ BUILD 36: Verificar se é o PRIMEIRO registro de peso do usuário COM RETRY
    const { data: existingEntries, error: checkError } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'weight')
        .limit(1);
      return result;
    });
    
    if (checkError) {
      console.error('❌ Erro ao verificar registros existentes:', checkError);
      throw checkError;
    }
    
    const isFirstWeight = !existingEntries || existingEntries.length === 0;
    
    console.log('📊 Weight registration check:', {
      isFirstWeight,
      dayOfWeek,
      existingEntriesCount: existingEntries?.length || 0
    });
    
    // ✅ REGRA 1: Se é o PRIMEIRO peso, permitir em QUALQUER dia
    if (isFirstWeight) {
      console.log('✅ Primeiro registro de peso - permitido em qualquer dia');
      
      const insertData = {
        user_id: userId,
        type: 'weight',
        value: weight,
        unit: 'kg',
        date: today.toISOString() // Registra no dia atual
      };
      
      console.log('💾 Inserting first weight entry:', insertData);

      const { data, error: insertError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('progress')
          .insert(insertData)
          .select()
          .single();
        return result;
      });

      if (insertError) {
        console.error('❌ Supabase insert error:', insertError);
        throw insertError;
      }

      console.log('✅ First weight entry added successfully:', data);
      await fetchWeightProgress();
      return true;
    }
    
    // ✅ REGRA 2: Para demais registros, verificar apenas se já pesou essa semana
    // Permite registro em QUALQUER dia da semana, mas apenas 1 vez por semana
    const alreadyWeighed = await hasWeighedThisWeek();
    console.log('📅 Already weighed this week?', alreadyWeighed);
    
    if (alreadyWeighed) {
      console.log('❌ User already weighed this week');
      setError('Você já registrou seu peso esta semana. Aguarde até a próxima semana para um novo registro.');
      return false;
    }

    console.log('✅ All validations passed - User has NOT weighed this week');
    
    // ✅ Salvar o peso no dia ATUAL do registro
    const insertData = {
      user_id: userId,
      type: 'weight',
      value: weight,
      unit: 'kg',
      date: today.toISOString().split('T')[0] // Salva no dia atual
    };
    
    console.log('💾 Inserting weight entry:', insertData);

    const { data, error: insertError } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('progress')
        .insert(insertData)
        .select()
        .single();
      return result;
    });

    if (insertError) {
      console.error('❌ Supabase insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      throw insertError;
    }

    console.log('✅ Weight entry added successfully:', data);

    // Refresh data after adding
    await fetchWeightProgress();
    return true;
  };

  const addWeightEntry = async (weight: number) => {
    if (!userId) {
      console.error('❌ No userId found');
      setError('Usuário não identificado');
      return false;
    }

    // ✅ Create promise with 30 second timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Servidor não respondeu em 30s')), 30000)
    );

    try {
      // ✅ Race between actual operation and timeout
      const result = await Promise.race([
        performWeightEntry(weight),
        timeoutPromise
      ]);
      
      return result;
    } catch (err: any) {
      console.error('❌ Error adding weight entry:', err);
      
      // ✅ Specific message for timeout
      if (err?.message?.includes('Timeout')) {
        setError('Servidor não respondeu. Verifique sua conexão e tente novamente.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar peso';
        setError(errorMessage);
      }
      
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
      // ✅ Use retry logic for weekly check
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('progress')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'weight')
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .limit(1);
        return result;
      });

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
    // Simplesmente verificar se já registrou peso esta semana
    // Se não registrou, mostrar modal em qualquer dia
    const alreadyWeighed = await hasWeighedThisWeek();
    return !alreadyWeighed; // Mostrar modal se NÃO pesou essa semana
  };

  const addWeightFromAssessment = async (weight: number, assessmentDate: string) => {
    if (!userId) return false;

    try {
      // Garantir formato ISO completo se a data vier em formato simples
      const formattedDate = assessmentDate.includes('T') 
        ? assessmentDate 
        : new Date(assessmentDate + 'T00:00:00').toISOString();
      
      console.log('💾 Adding weight from assessment:', { userId, weight, date: formattedDate });

      const { data, error: insertError } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          type: 'weight',
          value: weight,
          unit: 'kg',
          date: formattedDate
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