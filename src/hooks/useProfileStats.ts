import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface ProfileStats {
  points: number;
  sessionsCount: number;
  activeDays: number;
  examCount: number;
  photoCount: number;
  assessmentCount: number;
  loading: boolean;
  error: string | null;
}

export const useProfileStats = (): ProfileStats => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<Omit<ProfileStats, 'loading' | 'error'>>({
    points: 0,
    sessionsCount: 0,
    activeDays: 0,
    examCount: 0,
    photoCount: 0,
    assessmentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel for better performance
        const [
          pointsResult,
          sessionsResult,
          workoutDatesResult,
          examsResult,
          photosResult,
          assessmentsResult
        ] = await Promise.all([
          // User points
          supabase
            .from('user_points')
            .select('total_points')
            .eq('user_id', user.id)
            .maybeSingle(),

          // Workout sessions count
          supabase
            .from('workout_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // Workout dates for active days calculation
          supabase
            .from('workout_sessions')
            .select('start_time')
            .eq('user_id', user.id)
            .not('start_time', 'is', null)
            .order('start_time', { ascending: false }),

          // Medical exams - check if table exists first
          supabase
            .from('medical_exams')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // Progress photos - check if table exists first  
          supabase
            .from('progress_photos')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // Physical assessments
          supabase
            .from('progress')
            .select('date, type')
            .eq('user_id', user.id)
            .eq('type', 'physical_assessment')
        ]);

        // Process active days calculation
        const activeDaysSet = new Set(
          (workoutDatesResult.data || [])
            .filter((session: any) => session.start_time)
            .map((session: any) => new Date(session.start_time).toISOString().slice(0, 10))
        );

        // Process assessments unique dates
        const assessmentDatesSet = new Set(
          (assessmentsResult.data || [])
            .map((r: any) => new Date(r.date).toISOString().slice(0, 10))
        );

        setStats({
          points: pointsResult.data?.total_points || 0,
          sessionsCount: sessionsResult.count || 0,
          activeDays: activeDaysSet.size,
          examCount: examsResult.count || 0,
          photoCount: photosResult.count || 0,
          assessmentCount: assessmentDatesSet.size,
        });

      } catch (err) {
        console.error('Error fetching profile stats:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscriptions for key tables
    const channels = [
      supabase
        .channel('user_points_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_points',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          fetchStats();
        }),
        
      supabase
        .channel('workout_sessions_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'workout_sessions',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          fetchStats();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id]);

  return useMemo(() => ({
    ...stats,
    loading,
    error
  }), [stats, loading, error]);
};