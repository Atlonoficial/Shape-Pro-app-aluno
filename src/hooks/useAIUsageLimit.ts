import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

const DAILY_LIMIT = 3;

export const useAIUsageLimit = () => {
  const { user } = useAuthContext();
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canAsk, setCanAsk] = useState(true);

  const fetchUsage = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('ai_usage_stats')
        .select('daily_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      const count = data?.daily_count || 0;
      setDailyCount(count);
      setCanAsk(count < DAILY_LIMIT);
    } catch (error) {
      console.error('Error fetching AI usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user?.id]);

  const incrementUsage = () => {
    setDailyCount(prev => prev + 1);
    setCanAsk(dailyCount + 1 < DAILY_LIMIT);
  };

  const getResetTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return {
    dailyCount,
    dailyLimit: DAILY_LIMIT,
    canAsk,
    loading,
    remainingQuestions: Math.max(0, DAILY_LIMIT - dailyCount),
    resetTime: getResetTime(),
    refresh: fetchUsage,
    incrementUsage
  };
};
