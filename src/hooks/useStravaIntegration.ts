import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

interface StravaConnection {
  id: string;
  provider: string;
  provider_user_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  metadata: any;
}

interface StravaStats {
  weeklyDistance: number;
  weeklyDuration: number;
  weeklyCalorics: number;
  lastActivity: string | null;
}

export const useStravaIntegration = () => {
  const { user } = useAuthContext();
  const [connection, setConnection] = useState<StravaConnection | null>(null);
  const [stats, setStats] = useState<StravaStats>({
    weeklyDistance: 0,
    weeklyDuration: 0,
    weeklyCalorics: 0,
    lastActivity: null
  });
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Buscar conexão existente
  const fetchConnection = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('wearable_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'strava')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching connection:', error);
        return;
      }

      setConnection(data);
    } catch (error) {
      console.error('Error fetching connection:', error);
    }
  };

  // Buscar estatísticas da semana
  const fetchStats = async () => {
    if (!user?.id || !connection) return;

    try {
      setLoading(true);
      
      // Calcular início da semana
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      // Buscar atividades da semana
      const { data: activities, error: activitiesError } = await supabase
        .from('workout_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_id', connection.id)
        .gte('started_at', startOfWeek.toISOString())
        .order('started_at', { ascending: false });

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return;
      }

      // Calcular estatísticas
      const weeklyDistance = activities?.reduce((sum, a) => sum + (a.distance_meters || 0), 0) || 0;
      const weeklyDuration = activities?.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) || 0;
      const weeklyCalorics = activities?.reduce((sum, a) => sum + (a.calories_burned || 0), 0) || 0;
      const lastActivity = activities?.[0]?.started_at || null;

      setStats({
        weeklyDistance: Math.round(weeklyDistance / 1000 * 100) / 100, // km
        weeklyDuration: Math.round(weeklyDuration / 60), // minutos
        weeklyCalorics,
        lastActivity
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conectar com Strava
  const connectStrava = async () => {
    if (!user?.id) return;

    try {
      setConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('strava-auth', {
        body: { action: 'get_auth_url' }
      });

      if (error) {
        console.error('Error getting auth URL:', error);
        toast.error('Não foi possível obter URL de autorização do Strava');
        return;
      }

      if (!data?.authUrl) {
        toast.error('URL de autorização não recebida');
        return;
      }

      // Redirect to Strava authorization (instead of popup)
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Connect Strava error:', error);
      toast.error('Falha ao conectar com Strava');
    } finally {
      setConnecting(false);
    }
  };

  // Sincronizar dados
  const syncData = async () => {
    if (!user?.id || !connection) return;

    try {
      setLoading(true);
      toast.loading('Sincronizando dados do Strava...');

      const { error } = await supabase.functions.invoke('strava-sync', {
        body: { user_id: user.id }
      });

      if (error) {
        throw error;
      }

      toast.success('Dados sincronizados com sucesso!');
      await fetchStats();
      await fetchConnection();
    } catch (error) {
      console.error('Error syncing data:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  // Desconectar
  const disconnect = async () => {
    if (!connection) return;

    try {
      const { error } = await supabase
        .from('wearable_connections')
        .update({ is_active: false })
        .eq('id', connection.id);

      if (error) {
        throw error;
      }

      setConnection(null);
      setStats({
        weeklyDistance: 0,
        weeklyDuration: 0,
        weeklyCalorics: 0,
        lastActivity: null
      });
      
      toast.success('Desconectado do Strava');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  };

  useEffect(() => {
    fetchConnection();
  }, [user?.id]);

  useEffect(() => {
    if (connection) {
      fetchStats();
    }
  }, [connection]);

  return {
    connection,
    stats,
    loading,
    connecting,
    connectStrava,
    syncData,
    disconnect,
    isConnected: !!connection?.is_active
  };
};