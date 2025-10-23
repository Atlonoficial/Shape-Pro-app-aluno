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
      console.log('🔗 [Strava] Iniciando conexão...');

      // ✅ RETRY LOGIC: 3 tentativas com delay de 1s
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 [Strava] Tentativa ${attempt}/3 de obter URL de autorização...`);
          
          const { data, error } = await supabase.functions.invoke('strava-auth', {
            body: { action: 'get_auth_url' }
          });

          console.log(`📊 [Strava] Tentativa ${attempt} - Resposta:`, { 
            hasData: !!data, 
            hasError: !!error,
            errorMessage: error?.message 
          });

          if (error) {
            lastError = error;
            console.error(`❌ [Strava] Erro na tentativa ${attempt}:`, error);
            
            // Se for erro de configuração, não tentar novamente
            if (error.message?.includes("not configured") || 
                error.message?.includes("Missing secrets")) {
              console.error('❌ [Strava] Erro de configuração detectado, abortando retries');
              break;
            }
            
            // Se não for a última tentativa, esperar 1s antes de tentar novamente
            if (attempt < 3) {
              console.log(`⏳ [Strava] Aguardando 1s antes da próxima tentativa...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } else if (data?.authUrl) {
            console.log('✅ [Strava] URL de autorização obtida com sucesso');
            // Sucesso! Redirecionar
            window.location.href = data.authUrl;
            return;
          } else {
            console.error('❌ [Strava] Resposta sem authUrl:', data);
            lastError = new Error('No auth URL returned');
          }
          
        } catch (err: any) {
          lastError = err;
          console.error(`❌ [Strava] Exceção na tentativa ${attempt}:`, err);
          
          if (attempt < 3) {
            console.log(`⏳ [Strava] Aguardando 1s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      console.error('❌ [Strava] Todas as tentativas falharam. Último erro:', lastError);
      
      const errorMessage = lastError?.message || "Não foi possível conectar com o Strava";
      
      // Mensagens específicas para diferentes tipos de erro
      if (errorMessage.includes("not configured") || errorMessage.includes("Missing secrets")) {
        toast.error("Strava não configurado", {
          description: "A integração com o Strava não está configurada. Entre em contato com o suporte."
        });
      } else if (errorMessage.includes("Invalid authentication") || errorMessage.includes("No authorization header")) {
        toast.error("Sessão expirada", {
          description: "Sua sessão expirou. Por favor, faça login novamente."
        });
      } else if (errorMessage.includes("Failed to send a request")) {
        toast.error("Erro de conexão", {
          description: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."
        });
      } else {
        toast.error("Erro ao conectar", {
          description: errorMessage
        });
      }

    } catch (error: any) {
      console.error('❌ [Strava] Erro fatal:', error);
      toast.error("Erro inesperado", {
        description: error?.message || "Falha ao conectar com Strava"
      });
    } finally {
      setConnecting(false);
      console.log('🏁 [Strava] Processo de conexão finalizado');
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