import { useEffect, useState } from 'react';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

interface PermissionsState {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  push: 'granted' | 'denied' | 'prompt' | 'unknown';
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

  const requestPushPermission = async () => {
    try {
      console.log('[Permissions] 🔔 Requesting push notification permission...');
      
      // iOS: Mostrar explicação antes de solicitar
      toast.info('🔔 Ative as notificações para receber lembretes de treino e atualizações!', {
        duration: 4000,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        console.log('[Permissions] ✅ Push notification permission granted');
        setPermissions(prev => ({ ...prev, push: 'granted' }));
        
        // Registrar para receber notificações
        await PushNotifications.register();
        
        toast.success('Notificações ativadas com sucesso!');
        return true;
      } else {
        console.log('[Permissions] ❌ Push notification permission denied');
        setPermissions(prev => ({ ...prev, push: 'denied' }));
        toast.error('Permissão de notificações negada. Ative nas configurações do app.');
        return false;
      }
    } catch (error) {
      console.error('[Permissions] Push permission error:', error);
      setPermissions(prev => ({ ...prev, push: 'denied' }));
      return false;
    }
  };

  const checkPermissions = async () => {
    try {
      setPermissions(prev => ({ ...prev, loading: true }));

      // Verificar permissão de câmera
      const cameraResult = await Camera.checkPermissions();
      setPermissions(prev => ({ 
        ...prev, 
        camera: cameraResult.camera as PermissionsState['camera'] 
      }));

      // Verificar permissão de push
      const pushResult = await PushNotifications.checkPermissions();
      setPermissions(prev => ({ 
        ...prev, 
        push: pushResult.receive as PermissionsState['push'],
        loading: false
      }));

      console.log('[Permissions] Current state:', {
        camera: cameraResult.camera,
        push: pushResult.receive,
      });
    } catch (error) {
      console.error('[Permissions] Check error:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    permissions,
    requestCameraPermission,
    requestPushPermission,
    checkPermissions,
  };
};
