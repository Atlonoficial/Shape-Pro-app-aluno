import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface StravaStudentActivity {
  id: string;
  student_name: string;
  student_id: string;
  activity_type: string;
  name: string;
  distance_meters: number;
  duration_seconds: number;
  calories_burned: number;
  activity_date: string;
  points_earned?: number;
}

export interface StravaStudentMetrics {
  student_id: string;
  student_name: string;
  total_activities: number;
  total_distance_km: number;
  total_duration_hours: number;
  total_calories: number;
  last_activity: string | null;
  connection_status: 'connected' | 'disconnected';
  total_points_earned: number;
}

export interface StravaTeacherSummary {
  total_students_connected: number;
  total_activities_week: number;
  total_distance_week_km: number;
  total_points_awarded: number;
  most_active_student: string;
}

export const useStravaStudentData = () => {
  const { user } = useAuthContext();
  const [studentActivities, setStudentActivities] = useState<StravaStudentActivity[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StravaStudentMetrics[]>([]);
  const [teacherSummary, setTeacherSummary] = useState<StravaTeacherSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentStravaData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // 1. Buscar estudantes do professor
      const { data: students } = await supabase
        .from('students')
        .select(`
          user_id,
          profiles!inner(name)
        `)
        .eq('teacher_id', user.id);

      if (!students || students.length === 0) {
        setStudentActivities([]);
        setStudentMetrics([]);
        setTeacherSummary(null);
        return;
      }

      const studentIds = students.map(s => s.user_id);

      // 2. Buscar atividades recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activities } = await supabase
        .from('workout_activities')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      // 3. Buscar status de conexão Strava
      const { data: connections } = await supabase
        .from('wearable_connections')
        .select('user_id, is_active, last_sync_at')
        .in('user_id', studentIds)
        .eq('provider', 'strava');

      // 4. Buscar pontos de gamificação relacionados ao Strava
      const { data: stravaPoints } = await supabase
        .from('gamification_activities')
        .select('user_id, points_earned, metadata')
        .in('user_id', studentIds)
        .eq('activity_type', 'training_completed')
        .contains('metadata', { source: 'strava' });

      // Processar dados
      const studentMap = new Map(students.map(s => [s.user_id, s.profiles.name]));
      const connectionMap = new Map(connections?.map(c => [c.user_id, c]) || []);
      
      // Processar atividades
      const processedActivities: StravaStudentActivity[] = (activities || []).map(activity => ({
        id: activity.id,
        student_name: studentMap.get(activity.user_id) || 'Estudante',
        student_id: activity.user_id,
        activity_type: activity.activity_type,
        name: activity.name || 'Atividade',
        distance_meters: activity.distance_meters || 0,
        duration_seconds: activity.duration_seconds || 0,
        calories_burned: activity.calories_burned || 0,
        activity_date: activity.created_at,
        points_earned: stravaPoints?.find(p => 
          p.user_id === activity.user_id && 
          p.metadata && typeof p.metadata === 'object' && 
          (p.metadata as any).activity_id === activity.provider_activity_id
        )?.points_earned || 0
      }));

      // Processar métricas por estudante
      const metricsMap = new Map<string, StravaStudentMetrics>();
      
      students.forEach(student => {
        const studentActivities = processedActivities.filter(a => a.student_id === student.user_id);
        const connection = connectionMap.get(student.user_id);
        const totalPoints = stravaPoints?.filter(p => p.user_id === student.user_id)
          .reduce((sum, p) => sum + p.points_earned, 0) || 0;

        metricsMap.set(student.user_id, {
          student_id: student.user_id,
          student_name: student.profiles.name,
          total_activities: studentActivities.length,
          total_distance_km: Math.round(studentActivities.reduce((sum, a) => sum + a.distance_meters, 0) / 1000 * 100) / 100,
          total_duration_hours: Math.round(studentActivities.reduce((sum, a) => sum + a.duration_seconds, 0) / 3600 * 100) / 100,
          total_calories: studentActivities.reduce((sum, a) => sum + a.calories_burned, 0),
          last_activity: studentActivities[0]?.activity_date || null,
          connection_status: connection?.is_active ? 'connected' : 'disconnected',
          total_points_earned: totalPoints
        });
      });

      // Calcular resumo do professor
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weekActivities = processedActivities.filter(a => 
        new Date(a.activity_date) >= oneWeekAgo
      );

      const summary: StravaTeacherSummary = {
        total_students_connected: Array.from(connectionMap.values()).filter(c => c.is_active).length,
        total_activities_week: weekActivities.length,
        total_distance_week_km: Math.round(weekActivities.reduce((sum, a) => sum + a.distance_meters, 0) / 1000 * 100) / 100,
        total_points_awarded: stravaPoints?.reduce((sum, p) => sum + p.points_earned, 0) || 0,
        most_active_student: Array.from(metricsMap.values())
          .sort((a, b) => b.total_activities - a.total_activities)[0]?.student_name || ''
      };

      setStudentActivities(processedActivities);
      setStudentMetrics(Array.from(metricsMap.values()));
      setTeacherSummary(summary);

    } catch (error) {
      console.error('[useStravaStudentData] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Configurar real-time para novas atividades
  useEffect(() => {
    if (!user?.id) return;

    fetchStudentStravaData();

    // Escutar novas atividades
    const channel = supabase
      .channel(`teacher-strava-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_activities'
        },
        () => {
          // Refresh data when new activity is added
          fetchStudentStravaData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    studentActivities,
    studentMetrics,
    teacherSummary,
    loading,
    refresh: fetchStudentStravaData
  };
};