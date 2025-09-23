import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('connection-status');
    
    channel.subscribe((status) => {
      console.log('[ConnectionStatus] Subscription status:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
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