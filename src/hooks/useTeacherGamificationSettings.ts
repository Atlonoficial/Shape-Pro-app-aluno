import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentTeacher } from './useStudentTeacher';

interface GamificationSettings {
  id: string;
  teacher_id: string;
  points_workout: number;
  points_checkin: number;
  points_meal_log: number;
  points_progress_update: number;
  points_goal_achieved: number;
  points_assessment: number;
  points_medical_exam: number;
  points_ai_interaction: number;
  points_teacher_message: number;
  level_up_bonus: number;
  max_daily_points: number;
  auto_reset_enabled?: boolean;
  next_reset_date?: string;
  created_at: string;
  updated_at: string;
}

export const useTeacherGamificationSettings = () => {
  const { teacherId } = useStudentTeacher();
  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!teacherId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('gamification_settings')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (fetchError) {
        console.error('[useTeacherGamificationSettings] Error fetching settings:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        console.log('[useTeacherGamificationSettings] Settings loaded:', data);
        setSettings(data);
      } else {
        console.log('[useTeacherGamificationSettings] No settings found for teacher, using defaults');
        // Create default settings if none exist
        const defaultSettings = {
          teacher_id: teacherId,
          points_workout: 75,
          points_checkin: 10,
          points_meal_log: 25,
          points_progress_update: 100,
          points_goal_achieved: 300,
          points_assessment: 150,
          points_medical_exam: 100,
          points_ai_interaction: 5,
          points_teacher_message: 20,
          level_up_bonus: 50,
          max_daily_points: 500,
          auto_reset_enabled: false
        };

        const { data: newSettings, error: createError } = await supabase
          .from('gamification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          console.error('[useTeacherGamificationSettings] Error creating default settings:', createError);
          setError(createError.message);
        } else {
          console.log('[useTeacherGamificationSettings] Default settings created:', newSettings);
          setSettings(newSettings);
        }
      }
    } catch (err) {
      console.error('[useTeacherGamificationSettings] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  // Setup real-time subscription for settings changes
  useEffect(() => {
    if (!teacherId) return;

    console.log('[useTeacherGamificationSettings] Setting up real-time subscription for teacher:', teacherId);

    const channel = supabase
      .channel(`gamification-settings-${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamification_settings',
          filter: `teacher_id=eq.${teacherId}`
        },
        (payload) => {
          console.log('[useTeacherGamificationSettings] Real-time settings update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSettings(payload.new as GamificationSettings);
          } else if (payload.eventType === 'DELETE') {
            setSettings(null);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useTeacherGamificationSettings] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    teacherId
  };
};