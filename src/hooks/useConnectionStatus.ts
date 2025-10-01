import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;

    const checkConnection = async () => {
      if (!mounted) return;
      
      try {
        // Simple HTTP check without creating extra subscriptions
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (!error && mounted) {
          setStatus('connected');
        } else if (mounted) {
          setStatus('disconnected');
        }
      } catch (error) {
        if (mounted) {
          setStatus('disconnected');
        }
      }
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    checkInterval = setInterval(checkConnection, 30000);

    // Monitor network status
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      clearInterval(checkInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { status, isOnline };
};