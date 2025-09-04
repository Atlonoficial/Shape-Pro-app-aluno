import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    OneSignal?: any;
  }
}

// Get OneSignal App ID from environment
const getOneSignalAppId = async (): Promise<string> => {
  // Primeiro tentar buscar do edge function que tem acesso aos secrets
  try {
    const { data } = await supabase.functions.invoke('get-onesignal-config');
    if (data?.appId) {
      return data.appId;
    }
  } catch (error) {
    console.warn('Could not fetch OneSignal config from edge function:', error);
  }
  
  // Fallback para o ID padrão de desenvolvimento
  return '1af0b3d5-8b2a-4c75-9e6f-3a4b5c6d7e8f';
};

// Dinamicamente carregar o OneSignal SDK
const loadOneSignalSDK = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.OneSignal) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
    document.head.appendChild(script);
  });
};

export const initOneSignalWeb = async (userId?: string) => {
  try {
    console.log('OneSignal Web: Starting initialization...');
    
    // Carregar SDK dinamicamente
    await loadOneSignalSDK();
    
    if (!window.OneSignal) {
      console.log('OneSignal Web SDK not available after loading');
      return;
    }

    // Buscar App ID
    const appId = await getOneSignalAppId();
    console.log('OneSignal Web: Using App ID:', appId.substring(0, 8) + '...');

    await window.OneSignal.init({
      appId,
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "OneSignalSDKWorker.js",
      notificationClickHandlerMatch: "origin",
      allowLocalhostAsSecureOrigin: true,
    });

    console.log('OneSignal Web SDK initialized successfully');

    // Configurar handlers de notificação
    window.OneSignal.Notifications.addEventListener('click', (event: any) => {
      console.log('OneSignal Web: Notification clicked:', event);
      
      const data = event.notification.additionalData;
      if (data?.route) {
        // Navegar para a rota especificada
        window.location.href = data.route;
      } else if (data?.deep_link) {
        window.location.href = data.deep_link;
      }
    });

    window.OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
      console.log('OneSignal Web: Notification received in foreground:', event);
      // Permitir que a notificação seja exibida
      event.notification.display();
    });

    // Set user ID if authenticated
    if (userId) {
      await window.OneSignal.login(userId);
      console.log('OneSignal user logged in:', userId);
    }

    // Get subscription ID and save to Supabase
    const subscriptionId = await window.OneSignal.User.PushSubscription.id;
    if (subscriptionId && userId) {
      await updatePlayerIdInSupabase(subscriptionId, userId);
    }

    // Listen for subscription changes
    window.OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
      console.log('OneSignal Web: Subscription changed:', event);
      if (event.current.id && userId) {
        await updatePlayerIdInSupabase(event.current.id, userId);
      }
    });

    // Request permission
    if (Notification.permission === 'default') {
      await window.OneSignal.Slidedown.promptPush();
    }

  } catch (error) {
    console.error('OneSignal Web SDK initialization error:', error);
  }
};

const updatePlayerIdInSupabase = async (playerId: string, userId: string) => {
  try {
    console.log('OneSignal Web: Updating player ID in Supabase:', playerId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ onesignal_player_id: playerId })
      .eq('id', userId);
    
    if (error) {
      console.error('OneSignal Web: Error updating player ID:', error);
    } else {
      console.log('OneSignal Web: Player ID successfully saved to Supabase');
    }
  } catch (error) {
    console.error('OneSignal Web: Error updating player ID in Supabase:', error);
  }
};