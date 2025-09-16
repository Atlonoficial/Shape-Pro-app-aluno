import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useRealtimeGamification } from '@/hooks/useRealtimeGamification';

/**
 * Hook que integra automaticamente as atividades do Strava com o sistema de gamificação
 * Monitora novas atividades e concede pontos automaticamente
 */
export const useGamificationStravaIntegration = () => {
  const { user } = useAuthContext();
  const { awardPointsForAction } = useRealtimeGamification();

  useEffect(() => {
    if (!user?.id) return;

    // Escutar novas atividades do Strava inseridas no banco
    const channel = supabase
      .channel('strava-gamification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_activities',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const activity = payload.new;
          
          // Calcular pontos baseado na atividade
          let points = 50; // Base de pontos para qualquer atividade
          
          // Bônus por duração (1 ponto por minuto)
          if (activity.duration_seconds) {
            points += Math.floor(activity.duration_seconds / 60);
          }
          
          // Bônus por distância (1 ponto por km)
          if (activity.distance_meters) {
            points += Math.floor(activity.distance_meters / 1000);
          }
          
          // Bônus por calorias (1 ponto por 10 calorias)
          if (activity.calories_burned) {
            points += Math.floor(activity.calories_burned / 10);
          }
          
          // Cap máximo de pontos por atividade
          points = Math.min(points, 300);

          // Conceder pontos
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, awardPointsForAction]);

  return {
    // Este hook funciona em background, não precisa retornar nada
  };
};