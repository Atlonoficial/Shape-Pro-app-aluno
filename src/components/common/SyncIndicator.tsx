import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  status: 'connected' | 'syncing' | 'disconnected' | 'error';
  className?: string;
}

export const SyncIndicator = ({ status, className }: SyncIndicatorProps) => {
  const getIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-success" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-warning animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-4 h-4 text-destructive" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'connected':
        return 'Online';
      case 'syncing':
        return 'Sincronizando...';
      case 'disconnected':
        return 'Offline';
      case 'error':
        return 'Erro';
    }
  };

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {getIcon()}
      <span className="text-muted-foreground">{getLabel()}</span>
    </div>
  );
};
