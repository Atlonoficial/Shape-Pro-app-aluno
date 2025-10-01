import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentTeacher } from './useStudentTeacher';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

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

  // Default settings used when teacher hasn't configured custom values
  const DEFAULT_SETTINGS: Omit<GamificationSettings, 'id' | 'teacher_id' | 'created_at' | 'updated_at'> = {
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
    auto_reset_enabled: false,
  };

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
        console.log('[useTeacherGamificationSettings] No settings found, using in-memory defaults');
        // Use in-memory defaults instead of creating DB records
        // This prevents RLS violations when students try to fetch teacher settings
        setSettings({
          id: 'default',
          teacher_id: teacherId,
          ...DEFAULT_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('[useTeacherGamificationSettings] Unexpected error:', err);
      
      // Handle RLS violations gracefully
      if (err instanceof Error && err.message?.includes('row-level security')) {
        console.log('[useTeacherGamificationSettings] RLS violation detected, using defaults');
        setSettings({
          id: 'default',
          teacher_id: teacherId,
          ...DEFAULT_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setError(null); // Clear error since we handled it
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Realtime subscriptions using centralized manager
  useRealtimeManager({
    subscriptions: [
      {
        table: 'gamification_settings',
        event: '*',
        filter: `teacher_id=eq.${teacherId}`,
        callback: (payload) => {
          console.log('[useTeacherGamificationSettings] Real-time settings update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSettings(payload.new as GamificationSettings);
          } else if (payload.eventType === 'DELETE') {
            setSettings(null);
          }
        }
      }
    ],
    enabled: !!teacherId,
    channelName: `gamification-settings-${teacherId}`,
    debounceMs: 2000
  });

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    teacherId
  };
};