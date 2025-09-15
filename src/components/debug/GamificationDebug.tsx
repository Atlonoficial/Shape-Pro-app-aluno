import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";

interface DebugData {
  recentActivities: Array<{
    id: string;
    activity_type: string;
    points_earned: number;
    created_at: string;
  }>;
  userPoints: {
    total_points: number;
    level: number;
  } | null;
}

/**
 * Componente de debug para monitorar sistema de gamificação
 * Só deve ser usado em desenvolvimento para detectar problemas
 */
export const GamificationDebug = () => {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<DebugData>({
    recentActivities: [],
    userPoints: null
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchDebugData = async () => {
      try {
        // Buscar atividades recentes
        const { data: activities } = await supabase
          .from('gamification_activities')
          .select('id, activity_type, points_earned, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Buscar pontos do usuário
        const { data: points } = await supabase
          .from('user_points')
          .select('total_points, level')
          .eq('user_id', user.id)
          .single();

        setDebugData({
          recentActivities: activities || [],
          userPoints: points
        });
      } catch (error) {
        console.error('Debug fetch error:', error);
      }
    };

    fetchDebugData();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchDebugData, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 max-w-sm z-50 bg-white/90 backdrop-blur">
      <h3 className="font-bold text-sm mb-2">🔧 Gamification Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Pontos:</strong> {debugData.userPoints?.total_points || 0}
        </div>
        <div>
          <strong>Nível:</strong> {debugData.userPoints?.level || 1}
        </div>
        
        <div>
          <strong>Últimas atividades:</strong>
          {debugData.recentActivities.map((activity, i) => (
            <div key={activity.id} className="text-xs opacity-70">
              {i + 1}. {activity.activity_type} (+{activity.points_earned})
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};