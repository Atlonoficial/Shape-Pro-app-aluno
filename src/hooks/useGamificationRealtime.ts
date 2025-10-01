import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useRealtimeManager } from "./useRealtimeManager";

export interface RealtimeGamificationStats {
  userPoints: {
    total_points: number;
    level: number;
    current_streak: number;
    longest_streak: number;
  } | null;
  recentActivities: Array<{
    id: string;
    activity_type: string;
    points_earned: number;
    description: string;
    created_at: string;
  }>;
  loading: boolean;
}

/**
 * Hook que fornece dados de gamificação em tempo real para estudantes
 */
export const useGamificationRealtime = (): RealtimeGamificationStats => {
  const { user } = useAuthContext();
  const [userPoints, setUserPoints] = useState<RealtimeGamificationStats['userPoints']>(null);
  const [recentActivities, setRecentActivities] = useState<RealtimeGamificationStats['recentActivities']>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchInitialData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch user points
      const { data: points } = await supabase
        .from('user_points')
        .select('total_points, level, current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      setUserPoints(points);

      // Fetch recent activities (last 10)
      const { data: activities } = await supabase
        .from('gamification_activities')
        .select('id, activity_type, points_earned, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivities(activities || []);
    } catch (error) {
      console.error('[Gamification Real-time] Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data when user changes
  useEffect(() => {
    if (user?.id) {
      fetchInitialData();
    }
  }, [user?.id]);

  // Use centralized realtime manager
  useRealtimeManager({
    subscriptions: user?.id ? [
      {
        table: 'user_points',
        event: 'UPDATE',
        filter: `user_id=eq.${user.id}`,
        callback: (payload) => {
          console.log('[Real-time] Points updated:', payload);
          setUserPoints({
            total_points: payload.new.total_points,
            level: payload.new.level,
            current_streak: payload.new.current_streak,
            longest_streak: payload.new.longest_streak
          });
        }
      },
      {
        table: 'gamification_activities',
        event: 'INSERT',
        filter: `user_id=eq.${user.id}`,
        callback: (payload) => {
          console.log('[Real-time] New activity:', payload);
          const newActivity = {
            id: payload.new.id,
            activity_type: payload.new.activity_type,
            points_earned: payload.new.points_earned,
            description: payload.new.description,
            created_at: payload.new.created_at
          };
          setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]);
        }
      }
    ] : [],
    enabled: !!user?.id,
    channelName: 'gamification-student',
    debounceMs: 500
  });

  return {
    userPoints,
    recentActivities,
    loading
  };
};

/**
 * Hook que fornece estatísticas de gamificação em tempo real para professores
 */
export const useTeacherGamificationRealtime = () => {
  const { user } = useAuthContext();
  const [studentActivities, setStudentActivities] = useState<Array<{
    student_name: string;
    activity_type: string;
    points_earned: number;
    description: string;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent student activities
  const fetchStudentActivities = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Primeiro buscar IDs dos estudantes
      const { data: studentIds } = await supabase
        .from('students')
        .select('user_id')
        .eq('teacher_id', user.id);

      if (!studentIds || studentIds.length === 0) {
        setStudentActivities([]);
        return;
      }

      const userIds = studentIds.map(s => s.user_id);

      // Buscar atividades dos estudantes
      const { data: activities } = await supabase
        .from('gamification_activities')
        .select('activity_type, points_earned, description, created_at, user_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20);

      // Buscar nomes dos usuários
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      const processedActivities = (activities || []).map(activity => ({
        student_name: profileMap.get(activity.user_id) || 'Estudante',
        activity_type: activity.activity_type,
        points_earned: activity.points_earned,
        description: activity.description,
        created_at: activity.created_at
      }));

      setStudentActivities(processedActivities);
    } catch (error) {
      console.error('[Teacher Gamification Real-time] Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (user?.id) {
      fetchStudentActivities();
    }
  }, [user?.id]);

  // Use centralized realtime manager for teacher activities
  useRealtimeManager({
    subscriptions: user?.id ? [{
      table: 'gamification_activities',
      event: 'INSERT',
      callback: async (payload) => {
        // Verificar se é atividade de um estudante deste professor
        const { data: student } = await supabase
          .from('students')
          .select('user_id')
          .eq('user_id', payload.new.user_id)
          .eq('teacher_id', user.id)
          .single();

        if (student) {
          // Buscar nome do estudante
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .single();

          console.log('[Real-time] New student activity:', payload);
          const newActivity = {
            student_name: profile?.name || 'Estudante',
            activity_type: payload.new.activity_type,
            points_earned: payload.new.points_earned,
            description: payload.new.description,
            created_at: payload.new.created_at
          };
          
          setStudentActivities(prev => [newActivity, ...prev.slice(0, 19)]);
        }
      }
    }] : [],
    enabled: !!user?.id,
    channelName: 'gamification-teacher',
    debounceMs: 1000
  });

  return {
    studentActivities,
    loading,
    refresh: fetchStudentActivities
  };
};