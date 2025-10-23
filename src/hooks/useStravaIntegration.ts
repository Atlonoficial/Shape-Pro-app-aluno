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

      // ✅ CONFIGURAÇÃO HARDCODED
      const EDGE_FUNCTION_URL = 'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/strava-auth';
      const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm9wa3F6a2F2aG1lbmpsa2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODIwNTIsImV4cCI6MjA2NTE1ODA1Mn0.Bm2Gy1vqLWexVy8EpVi-KcmRlvpZ60eO3jIiVPpJ1zE';

      // ✅ Validar session antes de conectar
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast.error("Sessão expirada", {
          description: "Por favor, saia e entre novamente no aplicativo."
        });
        return;
      }

      const token = sessionData.session.access_token;

      // ✅ VALIDAÇÃO DE CONFIGURAÇÃO
      if (!token || !EDGE_FUNCTION_URL || !ANON_KEY) {
        console.error('❌ Configuração incompleta:', {
          hasToken: !!token,
          hasUrl: !!EDGE_FUNCTION_URL,
          hasKey: !!ANON_KEY
        });
        toast.error("Configuração incompleta", {
          description: "Faltam parâmetros necessários para conectar."
        });
        return;
      }

      console.log('✅ Sessão válida e configuração OK');
      console.log('🔍 URL:', EDGE_FUNCTION_URL);
      console.log('🔍 Token presente:', !!token);
      console.log('🔍 API Key presente:', !!ANON_KEY);

      // ✅ Testar conectividade primeiro (ping)
      console.log('📡 Testando conectividade com servidor...');
      try {
        const pingController = new AbortController();
        const pingTimeoutId = setTimeout(() => pingController.abort(), 30000);

        const pingResponse = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ANON_KEY
          },
          body: JSON.stringify({ action: 'ping' }),
          signal: pingController.signal
        });

        clearTimeout(pingTimeoutId);

        if (!pingResponse.ok) {
          toast.error("Servidor indisponível", {
            description: "Não foi possível conectar ao servidor. Tente novamente mais tarde."
          });
          return;
        }
        console.log('✅ Servidor acessível');
      } catch (pingError: any) {
        if (pingError.name === 'AbortError') {
          console.error('⏱️ Timeout no ping após 30s');
          toast.error("Timeout", {
            description: "Servidor demorou muito para responder."
          });
        } else if (pingError.message?.includes('Failed to fetch')) {
          console.error('🌐 Erro de rede no ping');
          toast.error("Sem conexão", {
            description: "Verifique sua conexão com a internet."
          });
        } else {
          console.error('❌ Erro no ping:', pingError);
          toast.error("Erro ao conectar", {
            description: "Não foi possível verificar conectividade."
          });
        }
        return;
      }

      // ✅ RETRY LOGIC: 3 tentativas com delay de 1s usando fetch direto
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 [Strava] Tentativa ${attempt}/3 de obter URL de autorização...`);
          
          // ✅ CONFIGURAÇÃO DO REQUEST COM TIMEOUT
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const requestConfig = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': ANON_KEY
            },
            body: JSON.stringify({ action: 'get_auth_url' }),
            signal: controller.signal
          };

          // ✅ LOGGING DETALHADO DO REQUEST
          console.log('📤 Enviando requisição:', {
            url: EDGE_FUNCTION_URL,
            method: requestConfig.method,
            headers: {
              'Content-Type': requestConfig.headers['Content-Type'],
              'Authorization': 'Bearer ***',
              'apikey': '***'
            },
            bodyAction: 'get_auth_url'
          });

          const response = await fetch(EDGE_FUNCTION_URL, requestConfig);
          clearTimeout(timeoutId);

          console.log(`📊 [Strava] Tentativa ${attempt} - Status:`, response.status);

          if (!response.ok) {
            if (response.status === 401) {
              toast.error("Sessão expirada", {
                description: "Por favor, saia e entre novamente no aplicativo."
              });
              return;
            } else if (response.status === 500) {
              const errorData = await response.json().catch(() => ({}));
              if (errorData.missingSecrets) {
                toast.error("Configuração pendente", {
                  description: "O Strava ainda não foi configurado pelo administrador."
                });
                return;
              }
            } else if (response.status === 0) {
              toast.error("Sem conexão", {
                description: "Não foi possível conectar ao servidor."
              });
              return;
            }
            
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            if (attempt < 3) {
              console.log(`⏳ [Strava] Aguardando 1s antes da próxima tentativa...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw lastError;
          }

          const data = await response.json();
          console.log('✅ [Strava] Resposta recebida:', { hasAuthUrl: !!data?.authUrl });

          if (!data?.authUrl) {
            throw new Error('URL de autorização não recebida');
          }

          console.log('🚀 [Strava] Redirecionando para Strava...');
          window.location.href = data.authUrl;
          return;
          
        } catch (err: any) {
          lastError = err;

          // ✅ TRATAMENTO MELHORADO DE ERROS DE REDE
          if (err.name === 'AbortError') {
            console.error('⏱️ Timeout após 30s');
            toast.error("Timeout", {
              description: "Servidor demorou muito para responder"
            });
            return;
          } else if (err.message?.includes('Failed to fetch')) {
            console.error('🌐 Erro de rede');
            toast.error("Sem conexão", {
              description: "Não foi possível conectar ao servidor"
            });
            return;
          }

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
      
      toast.error("Erro ao conectar", {
        description: errorMessage
      });

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