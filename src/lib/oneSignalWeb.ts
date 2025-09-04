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

// Aguardar Player ID com retry robusto
const waitForPlayerId = async (maxRetries = 10, delay = 2000): Promise<string | null> => {
  console.log('OneSignal Web: Waiting for Player ID...');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (window.OneSignal?.User?.PushSubscription) {
        const playerId = await window.OneSignal.User.PushSubscription.id;
        if (playerId) {
          console.log(`OneSignal Web: Player ID obtained on attempt ${attempt}:`, playerId);
          return playerId;
        }
      }
      
      console.log(`OneSignal Web: Attempt ${attempt}/${maxRetries} - Player ID not ready, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.warn(`OneSignal Web: Error on attempt ${attempt}:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('OneSignal Web: Failed to get Player ID after', maxRetries, 'attempts');
  return null;
};

export const initOneSignalWeb = async (userId?: string) => {
  try {
    console.log('OneSignal Web: Starting initialization for user:', userId);
    
    // Carregar SDK dinamicamente
    await loadOneSignalSDK();
    
    if (!window.OneSignal) {
      console.error('OneSignal Web SDK not available after loading');
      return;
    }

    // Buscar App ID
    const appId = await getOneSignalAppId();
    console.log('OneSignal Web: Using App ID:', appId.substring(0, 8) + '...');

    // Inicializar OneSignal
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
        window.location.href = data.route;
      } else if (data?.deep_link) {
        window.location.href = data.deep_link;
      }
    });

    window.OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
      console.log('OneSignal Web: Notification received in foreground:', event);
      event.notification.display();
    });

    // Set user ID se autenticado
    if (userId) {
      try {
        await window.OneSignal.login(userId);
        console.log('OneSignal Web: User logged in successfully:', userId);
      } catch (error) {
        console.error('OneSignal Web: Error logging in user:', error);
      }
    }

    // Solicitar permissão primeiro
    if (Notification.permission === 'default') {
      try {
        await window.OneSignal.Slidedown.promptPush();
        console.log('OneSignal Web: Permission requested');
      } catch (error) {
        console.error('OneSignal Web: Error requesting permission:', error);
      }
    }

    // Aguardar e obter Player ID com retry
    if (userId) {
      const playerId = await waitForPlayerId();
      if (playerId) {
        await updatePlayerIdInSupabaseWithRetry(playerId, userId);
      } else {
        console.error('OneSignal Web: Could not obtain Player ID');
      }
    }

    // Listen for subscription changes
    window.OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
      console.log('OneSignal Web: Subscription changed:', event);
      if (event.current?.id && userId) {
        await updatePlayerIdInSupabaseWithRetry(event.current.id, userId);
      }
    });

  } catch (error) {
    console.error('OneSignal Web SDK initialization error:', error);
  }
};

// Atualizar Player ID no Supabase com retry
const updatePlayerIdInSupabaseWithRetry = async (playerId: string, userId: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OneSignal Web: Updating player ID in Supabase (attempt ${attempt}):`, playerId);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('OneSignal Web: User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerId })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error(`OneSignal Web: Error updating player ID (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      console.log('OneSignal Web: Player ID successfully saved to Supabase:', data);
      
      // Verificar se realmente foi salvo
      const { data: verifyData } = await supabase
        .from('profiles')
        .select('onesignal_player_id')
        .eq('id', userId)
        .single();
      
      if (verifyData?.onesignal_player_id === playerId) {
        console.log('OneSignal Web: Player ID verification successful');
      } else {
        console.warn('OneSignal Web: Player ID verification failed');
      }
      
      return;
      
    } catch (error) {
      console.error(`OneSignal Web: Error updating player ID in Supabase (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        console.error('OneSignal Web: Failed to save Player ID after', maxRetries, 'attempts');
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
};

// Função para verificar status do Player ID
export const getPlayerIdStatus = async (userId: string): Promise<{hasPlayerId: boolean, playerId?: string}> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('onesignal_player_id')
      .eq('id', userId)
      .single();
    
    return {
      hasPlayerId: !!data?.onesignal_player_id,
      playerId: data?.onesignal_player_id
    };
  } catch (error) {
    console.error('OneSignal: Error checking player ID status:', error);
    return { hasPlayerId: false };
  }
};