import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff, Wifi } from 'lucide-react';
import { useIsMobileApp } from '@/hooks/useIsMobileApp';

export const NetworkStatus = () => {
  const { isMobileApp } = useIsMobileApp();
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isMobileApp) {
      // Web fallback
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      setIsOnline(navigator.onLine);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Native network monitoring
    let listener: any;
    
    const setupListener = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        
        listener = await Network.addListener('networkStatusChange', (status) => {
          console.log('[NetworkStatus] Network changed:', status.connected);
          setIsOnline(status.connected);
          setShowBanner(!status.connected);
          
          // Auto-hide banner after 3s if back online
          if (status.connected) {
            setTimeout(() => setShowBanner(false), 3000);
          }
        });
      } catch (error) {
        console.error('[NetworkStatus] Error setting up listener:', error);
      }
    };

    setupListener();

    return () => {
      listener?.remove();
    };
  }, [isMobileApp]);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    }
  }, [isOnline]);

  if (!showBanner || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-notification bg-destructive text-destructive-foreground px-4 py-3 shadow-lg animate-slide-down">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          Você está offline. Algumas funcionalidades podem não funcionar.
        </span>
      </div>
    </div>
  );
};
