import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

export const ConnectionStatus = () => {
  const { status, isOnline } = useConnectionStatus();

  if (!isOnline || status === 'disconnected') {
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