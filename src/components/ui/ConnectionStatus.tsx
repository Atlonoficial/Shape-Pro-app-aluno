import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Monitor connection status
    const channel = supabase.channel('connection-status', {
      config: {
        broadcast: { self: true },
        presence: { key: 'connection-check' }
      }
    });
    
    channel
      .subscribe((status) => {
        if (!mounted) return;
        
        console.log('[ConnectionStatus UI] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isConnected) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <WifiOff className="h-3 w-3" />
        <span className="text-xs">Offline</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
      <Wifi className="h-3 w-3" />
      <span className="text-xs">Tempo Real</span>
    </Badge>
  );
};