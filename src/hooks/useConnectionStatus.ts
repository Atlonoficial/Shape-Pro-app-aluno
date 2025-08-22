import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor connection status
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        setStatus('connected');
      } catch (error) {
        console.error('Connection check failed:', error);
        setStatus('disconnected');
      }
    };

    // Check initially
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 30000);

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