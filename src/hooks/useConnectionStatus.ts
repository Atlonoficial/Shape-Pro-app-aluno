import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobileApp } from './useIsMobileApp';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isMobileApp, platform } = useIsMobileApp();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    // Monitor connection status
    const checkConnection = async () => {
      try {
        console.log('[ConnectionStatus] Checking connection...', {
          isMobileApp,
          platform,
          isOnline,
          retryCount
        });
        
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        
        console.log('[ConnectionStatus] ✅ Connection successful');
        setStatus('connected');
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('[ConnectionStatus] ❌ Connection check failed:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[ConnectionStatus] Retrying... (${retryCount}/${maxRetries})`);
          setStatus('connecting');
          setTimeout(checkConnection, 2000 * retryCount); // Exponential backoff
        } else {
          setStatus('disconnected');
        }
      }
    };

    // Check initially
    checkConnection();

    // Check periodically (longer interval for mobile to save battery)
    const interval = setInterval(checkConnection, isMobileApp ? 60000 : 30000);

    // Listen to online/offline events
    const handleOnline = () => {
      console.log('[ConnectionStatus] Network online');
      setIsOnline(true);
      setStatus('connecting');
      retryCount = 0;
      checkConnection();
    };

    const handleOffline = () => {
      console.log('[ConnectionStatus] Network offline');
      setIsOnline(false);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMobileApp, platform]);

  return { status, isOnline };
};