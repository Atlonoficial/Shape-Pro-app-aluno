import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobileApp } from './useIsMobileApp';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isMobileApp, platform } = useIsMobileApp();

  useEffect(() => {
    // Monitor connection status
    const checkConnection = async () => {
      try {
        console.log('[ConnectionStatus] Checking connection...', {
          isMobileApp,
          platform,
          isOnline
        });
        
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        
        console.log('[ConnectionStatus] ✅ Connection successful');
        setStatus('connected');
      } catch (error) {
        console.error('[ConnectionStatus] ❌ Connection check failed:', error);
        setStatus('disconnected');
      }
    };

    // Check initially
    checkConnection();

    // Check periodically (longer interval for mobile to save battery)
    const interval = setInterval(checkConnection, isMobileApp ? 60000 : 30000);

    // Listen to online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('connecting');
      checkConnection();
    };

    const handleOffline = () => {
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
  }, []);

  return { status, isOnline };
};