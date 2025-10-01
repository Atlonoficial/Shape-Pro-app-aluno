import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '@/hooks/useConnectionStatus';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  isReconnecting?: boolean;
  className?: string;
}

export const ConnectionIndicator = ({ 
  status, 
  isReconnecting = false,
  className = ""
}: ConnectionIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Conectado',
          color: 'text-success',
          bgColor: 'bg-success/10 border-success/20'
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: isReconnecting ? 'Reconectando...' : 'Conectando...',
          color: 'text-warning',
          bgColor: 'bg-warning/10 border-warning/20',
          animate: true
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Desconectado',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10 border-destructive/20'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${className} transition-all duration-300`}>
      <Icon 
        size={16} 
        className={`${config.color} ${config.animate ? 'animate-spin' : ''}`} 
      />
      <span className={`text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};