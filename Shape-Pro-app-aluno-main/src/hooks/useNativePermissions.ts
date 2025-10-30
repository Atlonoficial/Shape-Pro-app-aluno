import { useState } from 'react';
import { Camera } from '@capacitor/camera';
// ✅ BUILD 24: Removido PushNotifications - OneSignal gerencia tudo
import { toast } from 'sonner';

interface PermissionsState {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  push: 'granted' | 'denied' | 'prompt' | 'unknown'; // Mantido para compatibilidade
  loading: boolean;
}

export const useNativePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    camera: 'unknown',
    push: 'unknown',
    loading: false,
  });

  const requestCameraPermission = async () => {
    try {
      console.log('[Permissions] 📸 Requesting camera permission...');
      const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      
      if (result.camera === 'granted' && result.photos === 'granted') {
        console.log('[Permissions] ✅ Camera permission granted');
        setPermissions(prev => ({ ...prev, camera: 'granted' }));
        return true;
      } else {
        console.log('[Permissions] ❌ Camera permission denied');
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
        toast.error('Permissão de câmera negada. Ative nas configurações do app.');
        return false;
      }
    } catch (error) {
      console.error('[Permissions] Camera permission error:', error);
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      return false;
    }
  };

  // ✅ BUILD 24: Removido requestPushPermission - OneSignal gerencia

  // ✅ BUILD 24: checkPermissions simplificado (só câmera)
  const checkPermissions = async () => {
    try {
      console.log('[Permissions] 🔍 Checking camera permission...');
      setPermissions(prev => ({ ...prev, loading: true }));

      const cameraPermission = await Camera.checkPermissions();
      console.log('[Permissions] Camera status:', cameraPermission);

      setPermissions({
        camera: (cameraPermission.camera || cameraPermission.photos) as PermissionsState['camera'] || 'unknown',
        push: 'unknown', // OneSignal gerencia
        loading: false,
      });
    } catch (error) {
      console.error('[Permissions] Error checking permissions:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    permissions,
    requestCameraPermission,
    checkPermissions,
  };
};
