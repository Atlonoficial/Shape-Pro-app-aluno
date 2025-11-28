import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useWeeklyWeightModal = () => {
  const { user } = useAuth();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMissedLastWeek = async () => {
    if (!user?.id) return false;

    try {
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday

      // Calculate last Friday
      // If today is Friday (5), last Friday was 7 days ago? Or today?
      // Assuming we want to check if they missed the *previous* cycle.
      // Let's assume "Last Friday" means the Friday of the previous week if today is early in the week,
      // or the Friday of the current week if today is Saturday?
      // Let's stick to the logic found in the snippet:
      // const daysToLastFriday = (currentDay + 2) % 7; 
      // This logic seems specific. Let's implement a standard "Last Friday" finder.

      const daysSinceFriday = (currentDay + 2) % 7; // If today is Fri(5), (5+2)%7 = 0. If Sat(6), (6+2)%7 = 1.
      const lastFriday = new Date(today);
      lastFriday.setDate(today.getDate() - daysSinceFriday);

      // If today is Friday, we might want to check *today*.
      // But if we are checking "missed", maybe we check if they didn't weigh in on Friday?

      // Let's look at the snippet's logic again:
      // const lastWeekStart = new Date(lastFriday);
      // lastWeekStart.setDate(lastFriday.getDate() - lastFriday.getDay()); // Sunday before Friday

      // Logic from snippet seems to define a "week" around that Friday.

      // Simplified logic: Check if user weighed in the last 7 days?
      // Or specifically "Last Week".

      // Let's implement a robust check:
      // 1. Check if weighed this week (since Sunday).
      // 2. If not, check if missed last week's Friday?

      // Re-implementing based on the snippet's intent:
      // "Início da semana da última sexta-feira"

      const lastWeekStart = new Date(lastFriday);
      lastWeekStart.setDate(lastFriday.getDate() - lastFriday.getDay()); // Sunday

      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Saturday

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
      return missedLastWeek;

    } catch (error) {
      console.error('Error in checkMissedLastWeek:', error);
      return false;
    }
  };

  const checkWeightStatus = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Check if weighed TODAY or THIS WEEK
      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

      const { data: recentWeight, error } = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'weight')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .limit(1);

      if (error) throw error;

      const hasWeighedThisWeek = recentWeight && recentWeight.length > 0;

      if (hasWeighedThisWeek) {
        setShouldShowModal(false);
      } else {
        // If haven't weighed this week, check if we should prompt
        // Maybe prompt if it's Friday?
        const isFriday = new Date().getDay() === 5;
        if (isFriday) {
          setShouldShowModal(true);
        } else {
          // Or if missed last week?
          const missed = await checkMissedLastWeek();
          if (missed) {
            // Maybe prompt to catch up?
            // For now, let's keep it simple: Show if Friday and not weighed.
            // Or if the user logic intended to show "You missed last week".
            // The snippet had `return missedLastWeek`.
            setShouldShowModal(missed);
          }
        }
      }

    } catch (error) {
      console.error('Error checking weight status:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markWeightModalDismissed = useCallback(() => {
    setShouldShowModal(false);
    const dismissedKey = `weight_modal_dismissed_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(dismissedKey, 'true');
  }, []);

  const shouldShowModalToday = useCallback(() => {
    const dismissedKey = `weight_modal_dismissed_${new Date().toISOString().split('T')[0]}`;
    const wasDismissedToday = localStorage.getItem(dismissedKey);
    return shouldShowModal && !wasDismissedToday;
  }, [shouldShowModal]);

  useEffect(() => {
    checkWeightStatus();
  }, [checkWeightStatus]);

  return {
    shouldShowModal: shouldShowModalToday(),
    loading,
    refreshStatus: checkWeightStatus,
    markDismissed: markWeightModalDismissed
  };
};