import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type DeviceContext = 'mobile-native' | 'web';
export type Platform = 'ios' | 'android' | 'web';

export interface DeviceContextData {
  context: DeviceContext;
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

export function useDeviceContext(): DeviceContextData {
  const [contextData, setContextData] = useState<DeviceContextData>({
    context: 'web',
    platform: 'web',
    isNative: false,
    isIOS: false,
    isAndroid: false,
    isWeb: true,
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as Platform;
    
    const data: DeviceContextData = {
      context: isNative ? 'mobile-native' : 'web',
      platform: platform,
      isNative: isNative,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
    };
    
    setContextData(data);
    
    console.log('[useDeviceContext] 📱 Context detected:', {
      context: data.context,
      platform: data.platform,
      isNative: data.isNative,
    });
  }, []);

  return contextData;
}
