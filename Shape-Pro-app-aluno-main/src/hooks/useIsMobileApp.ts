import { useState, useEffect } from 'react';

export const useIsMobileApp = () => {
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    const checkPlatform = () => {
      if (typeof window === 'undefined') return;

      const capacitor = (window as any).Capacitor;
      
      if (capacitor) {
        setIsMobileApp(true);
        
        // Detect specific platform
        if (capacitor.getPlatform) {
          const platformName = capacitor.getPlatform();
          setPlatform(platformName as 'ios' | 'android' | 'web');
        }
        
        console.log('[useIsMobileApp] Running in Capacitor:', {
          platform: capacitor.getPlatform?.() || 'unknown',
          isNative: capacitor.isNativePlatform?.() || false
        });
      } else {
        setIsMobileApp(false);
        setPlatform('web');
      }
    };

    checkPlatform();
  }, []);

  return { isMobileApp, platform, isNative: isMobileApp };
};
