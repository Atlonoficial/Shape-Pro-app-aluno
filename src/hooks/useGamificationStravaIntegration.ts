import { useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useRealtimeGamification } from '@/hooks/useRealtimeGamification';

/**
 * ✅ BUILD 55: Otimizado para usar canal global
 * ANTES: Canal próprio 'strava-gamification-{userId}'
 * DEPOIS: Listener do evento 'workout-activity-created' do useGlobalRealtime
 * 
 * Hook que integra automaticamente as atividades do Strava com o sistema de gamificação
 * Monitora novas atividades e concede pontos automaticamente
 */
export const useGamificationStravaIntegration = () => {
  const { user } = useAuthContext();
  const { awardPointsForAction } = useRealtimeGamification();

  // ✅ Listener para novas atividades do canal global
  useEffect(() => {
    const handleActivity = async (event: any) => {
      const activity = event.detail;
      
      let points = 50;
      
      if (activity.duration_seconds) {
        points += Math.floor(activity.duration_seconds / 60);
      }
      
      if (activity.distance_meters) {
        points += Math.floor(activity.distance_meters / 1000);
      }
      
      if (activity.calories_burned) {
        points += Math.floor(activity.calories_burned / 10);
      }
      
      points = Math.min(points, 300);

      try {
        await awardPointsForAction(
          'training_completed',
          `Atividade ${activity.activity_type}: ${activity.name}`,
          {
            source: 'strava',
            activity_id: activity.provider_activity_id,
            activity_type: activity.activity_type,
            distance_km: activity.distance_meters ? Math.round(activity.distance_meters / 1000 * 100) / 100 : 0,
            duration_minutes: activity.duration_seconds ? Math.floor(activity.duration_seconds / 60) : 0,
            calories: activity.calories_burned || 0,
            custom_points: points
          }
        );

        console.log(`🏃‍♂️ Pontos concedidos automaticamente: ${points} pontos para atividade ${activity.name}`);
      } catch (error) {
        console.error('Erro ao conceder pontos para atividade do Strava:', error);
      }
    };
    
    window.addEventListener('workout-activity-created', handleActivity);
    return () => window.removeEventListener('workout-activity-created', handleActivity);
  }, [user?.id, awardPointsForAction]);

  return {};
};