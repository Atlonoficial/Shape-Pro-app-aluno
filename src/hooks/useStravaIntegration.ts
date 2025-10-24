import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

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
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);
  const [failureCount, setFailureCount] = useState(0);

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
    try {
      // Circuit breaker check
      if (circuitBreakerOpen) {
        toast.error("Sistema temporariamente indisponível", {
          description: "Muitas tentativas falharam. Aguarde alguns minutos antes de tentar novamente.",
          duration: 5000
        });
        return;
      }

      setConnecting(true);
      
      const EDGE_FUNCTION_URL = 'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/strava-auth';
      const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm9wa3F6a2F2aG1lbmpsa2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNDk3NDgsImV4cCI6MjA1MTkyNTc0OH0.eqhLLEGaWdqy1JHb4iqS9GxSf3dLMD-ggj3b6sZz2Gg';
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error("Erro de autenticação", {
          description: "Por favor, faça login novamente"
        });
        setFailureCount(prev => prev + 1);
        return;
      }

      // Validar configuração antes de fazer requests
      if (!EDGE_FUNCTION_URL || !ANON_KEY) {
        console.error('❌ [Strava] Configuração incompleta');
        toast.error("Erro de configuração", {
          description: "Sistema não está configurado corretamente"
        });
        setFailureCount(prev => prev + 1);
        return;
      }

      console.log('🔍 [Strava] Configuração validada:', {
        url: EDGE_FUNCTION_URL,
        tokenPresent: !!token,
        apiKeyPresent: !!ANON_KEY
      });

      // Validate secrets first
      console.log('🔐 [Strava] Validating secrets...');
      try {
        const pingResponse = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': ANON_KEY
          },
          body: JSON.stringify({ action: 'ping' })
        });

        const pingData = await pingResponse.json();
        console.log('🔐 [Strava] Secrets validation:', pingData);

        if (!pingData?.secretsConfigured) {
          console.error('❌ [Strava] Secrets not configured');
          toast.error("Configuração incompleta", {
            description: "Secrets do Strava não estão configurados. Entre em contato com o suporte.",
            duration: 5000
          });
          setFailureCount(prev => prev + 1);
          return;
        }

        console.log('✅ [Strava] Secrets validated successfully');
      } catch (pingErr) {
        console.error('❌ [Strava] Error validating secrets:', pingErr);
        toast.error("Erro ao validar configuração", {
          description: "Não foi possível verificar a configuração do Strava",
          duration: 5000
        });
        setFailureCount(prev => prev + 1);
        return;
      }

      // GET AUTH URL - Obter URL de autorização (com retry e backoff exponencial)
      console.log('🔐 [Strava] Solicitando URL de autorização...');
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 [Strava] Tentativa ${attempt} de 3...`);
        
        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        // Detect platform explicitly
        const platform = Capacitor.isNativePlatform() ? 'mobile' : 'web';
        
        const requestConfig = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': ANON_KEY
          },
        body: JSON.stringify({
          action: 'get_auth_url',
          platform: Capacitor.isNativePlatform() ? 'mobile' : 'web'
        }),
          signal: controller.signal
        };

        console.log('📤 [Strava] Enviando requisição:', {
          url: EDGE_FUNCTION_URL,
          method: requestConfig.method,
          headers: {
            'Content-Type': requestConfig.headers['Content-Type'],
            'Authorization': 'Bearer ***',
            'apikey': '***'
          },
          bodyAction: 'get_auth_url',
          platform: platform
        });

        try {
          const response = await fetch(EDGE_FUNCTION_URL, requestConfig);
          clearTimeout(timeoutId);
          
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);

          console.log(`📊 [Strava] Tentativa ${attempt} - Status: ${response.status}, Tempo: ${duration}ms`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Strava] Erro na tentativa ${attempt}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              duration: `${duration}ms`
            });
            
            if (attempt === 3) {
              setFailureCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 3) {
                  setCircuitBreakerOpen(true);
                  setTimeout(() => {
                    setCircuitBreakerOpen(false);
                    setFailureCount(0);
                  }, 60000); // Reabre após 1 minuto
                }
                return newCount;
              });
              
              toast.error("Falha na conexão", {
                description: "Verifique: 1) Sua conexão com internet, 2) Se o app está atualizado, 3) Tente novamente em alguns minutos",
                duration: 5000
              });
              return;
            }
            
            // Backoff exponencial: 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ [Strava] Aguardando ${delay/1000}s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          const data = await response.json();
          console.log('✅ [Strava] URL de autorização recebida:', data);

          // Resetar failure count em caso de sucesso
          setFailureCount(0);

          if (data.authUrl) {
            console.log('🚀 [Strava] Redirecionando para Strava...');
            
            // Use Capacitor Browser on mobile, window.location on web
            if (Capacitor.isNativePlatform()) {
              console.log('📱 [Strava] Abrindo Strava via Capacitor Browser (mobile)');
              await Browser.open({ 
                url: data.authUrl,
                presentationStyle: 'popover'
              });
            } else {
              console.log('🌐 [Strava] Abrindo Strava via window.location (web)');
              window.location.href = data.authUrl;
            }
            return;
          } else {
            console.error('❌ [Strava] authUrl não encontrado na resposta');
            toast.error("Erro", {
              description: "URL de autorização não foi gerada"
            });
            return;
          }
        } catch (err: any) {
          setFailureCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 3) {
              setCircuitBreakerOpen(true);
              setTimeout(() => {
                setCircuitBreakerOpen(false);
                setFailureCount(0);
              }, 60000);
            }
            return newCount;
          });

          if (err.name === 'AbortError') {
            console.error('⏱️ [Strava] Timeout após 30s');
            toast.error("Timeout", {
              description: "Servidor demorou muito para responder. Verifique sua conexão e tente novamente.",
              duration: 5000
            });
          } else if (err.message?.includes('Failed to fetch')) {
            console.error('🌐 [Strava] Erro de rede:', err);
            toast.error("Sem conexão", {
              description: "Não foi possível conectar ao servidor. Verifique: 1) Se você está online, 2) Se tem acesso à internet.",
              duration: 5000
            });
          } else {
            console.error('❌ [Strava] Erro desconhecido:', err);
            toast.error("Erro inesperado", {
              description: err.message || "Ocorreu um erro ao conectar com o Strava. Tente novamente.",
              duration: 5000
            });
          }
          break;
        }
      }

    } catch (error: any) {
      console.error('❌ [Strava] Erro fatal:', error);
      toast.error("Erro inesperado", {
        description: error?.message || "Falha ao conectar com Strava"
      });
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