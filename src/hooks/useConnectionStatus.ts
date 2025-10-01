import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobileApp } from './useIsMobileApp';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [useHttpFallback, setUseHttpFallback] = useState(false);
  const { isMobileApp, platform } = useIsMobileApp();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let wsHealthCheck: ReturnType<typeof setInterval> | null = null;

    // WebSocket health check via realtime
    const checkWebSocketHealth = () => {
      const channel = supabase.channel('health-check');
      
      const timeout = setTimeout(() => {
        console.warn('[ConnectionStatus] ⚠️ WebSocket timeout, enabling HTTP fallback');
        setUseHttpFallback(true);
        supabase.removeChannel(channel);
      }, 5000);

      channel
        .subscribe((status) => {
          clearTimeout(timeout);
          if (status === 'SUBSCRIBED') {
            console.log('[ConnectionStatus] ✅ WebSocket healthy');
            setUseHttpFallback(false);
            setStatus('connected');
          }
        });

      return () => {
        clearTimeout(timeout);
        supabase.removeChannel(channel);
      };
    };

    // HTTP fallback connection check
    const checkConnection = async () => {
      try {
        console.log('[ConnectionStatus] Checking connection...', {
          isMobileApp,
          platform,
          isOnline,
          retryCount,
          useHttpFallback
        });
        
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        
        console.log('[ConnectionStatus] ✅ HTTP Connection successful');
        setStatus('connected');
        retryCount = 0;
        
        // Try to restore WebSocket if using fallback
        if (useHttpFallback) {
          checkWebSocketHealth();
        }
      } catch (error) {
        console.error('[ConnectionStatus] ❌ Connection check failed:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[ConnectionStatus] Retrying... (${retryCount}/${maxRetries})`);
          setStatus('connecting');
          setTimeout(checkConnection, 2000 * retryCount);
        } else {
          setStatus('disconnected');
        }
      }
    };

    // Initial checks
    checkConnection();
    const cleanup = checkWebSocketHealth();

    // Periodic WebSocket health check (every 30s)
    wsHealthCheck = setInterval(() => {
      if (!useHttpFallback) {
        checkWebSocketHealth();
      }
    }, 30000);

    // HTTP fallback check (less frequent to save resources)
    const httpInterval = setInterval(checkConnection, isMobileApp ? 60000 : 45000);

    // Network event listeners
    const handleOnline = () => {
      console.log('[ConnectionStatus] 🌐 Network online');
      setIsOnline(true);
      setStatus('connecting');
      retryCount = 0;
      setUseHttpFallback(false);
      checkConnection();
      checkWebSocketHealth();
    };

    const handleOffline = () => {
      console.log('[ConnectionStatus] 📡 Network offline');
      setIsOnline(false);
      setStatus('disconnected');
      setUseHttpFallback(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (wsHealthCheck) clearInterval(wsHealthCheck);
      clearInterval(httpInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanup();
    };
  }, [isMobileApp, platform]);

  return { status, isOnline, useHttpFallback };
};