import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStreakData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak data:', error);
        return;
      }

      setStreakData(data);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: currentData } = await supabase
        .from('user_points')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (!currentData) return;

      const lastActivity = currentData.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrentStreak = 1;
      
      if (lastActivity === yesterdayStr) {
        // Consecutivo
        newCurrentStreak = (currentData.current_streak || 0) + 1;
      } else if (lastActivity === today) {
        // Já ativo hoje
        return;
      }

      const newLongestStreak = Math.max(
        newCurrentStreak, 
        currentData.longest_streak || 0
      );

      await supabase
        .from('user_points')
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today,
        })
        .eq('user_id', user.id);

      setStreakData({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      });
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  useEffect(() => {
    fetchStreakData();
  }, [user?.id]);

  return {
    streakData,
    loading,
    updateStreak,
    fetchStreakData,
  };
};