// src/lib/push.ts
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    plugins: {
      OneSignal: any;
    };
    device?: {
      platform: string;
    };
    cordova?: any;
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

let isInitialized = false;
let currentExternalUserId: string | null = null;

// Detectar se é mobile (Capacitor/Cordova) ou web
const isMobileApp = () => {
  return !!window.device || !!window.cordova;
};

export async function initPush(externalUserId?: string) {
  const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!APP_ID) {
    if (import.meta.env.DEV) {
      console.warn('OneSignal: APP_ID not configured');
    }
    return;
  }

  // Inicializar Web ou Mobile baseado no ambiente
  if (isMobileApp()) {
    initMobilePush(APP_ID, externalUserId);
  } else {
    initWebPush(APP_ID, externalUserId);
  }
}

// Inicialização Mobile (Cordova/Capacitor)
function initMobilePush(APP_ID: string, externalUserId?: string) {
  document.addEventListener('deviceready', async () => {
    try {
      if (!window.plugins?.OneSignal) {
        if (import.meta.env.DEV) {
          console.log('OneSignal: Plugin not available');
        }
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      if (import.meta.env.DEV) {
        console.log('OneSignal Native: Initializing with APP_ID:', APP_ID.substring(0, 8) + '...');
      }
      
      OneSignal.setAppId(APP_ID);

      // iOS: solicitar permissão explicitamente
      if (window.device?.platform === 'iOS') {
        OneSignal.Notifications?.requestPermission?.(true, (accepted: boolean) => {
          if (import.meta.env.DEV) {
            console.log('OneSignal iOS: Permission explicitly requested:', accepted ? 'granted' : 'denied');
          }
        });
      }

      // Fallback para método anterior
      OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
        if (import.meta.env.DEV) {
          console.log('OneSignal Native: Push permission:', accepted ? 'granted' : 'denied');
        }
      });

      // Definir external user ID se disponível
      if (externalUserId) {
        currentExternalUserId = externalUserId;
        if (import.meta.env.DEV) {
          console.log('OneSignal Native: Setting external user ID:', externalUserId);
        }
        OneSignal.setExternalUserId(String(externalUserId));
      }

      // Sincronizar playerId no backend
      OneSignal.getDeviceState((state: any) => {
        const playerId = state?.userId;
        if (playerId && externalUserId) {
          if (import.meta.env.DEV) {
            console.log('OneSignal Native: Got Player ID:', playerId);
          }
          updatePlayerIdInSupabase(playerId, externalUserId);
        }
      });

      // Handler para notificações em foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        if (import.meta.env.DEV) {
          console.log('OneSignal Native: Notification received in foreground:', notificationReceivedEvent);
        }
        const notification = notificationReceivedEvent.getNotification();
        notificationReceivedEvent.complete(notification);
      });

      // Handler para quando notificação é tocada
      OneSignal.setNotificationOpenedHandler((result: any) => {
        if (import.meta.env.DEV) {
          console.log('OneSignal Native: Notification opened:', result);
        }
        const { notification } = result;
        handleNotificationAction(notification.additionalData);
      });

      // Listener para mudanças de subscription
      OneSignal.addSubscriptionObserver((event: any) => {
        if (event.to.userId && externalUserId) {
          if (import.meta.env.DEV) {
            console.log('OneSignal Native: Subscription changed, updating Player ID');
          }
          updatePlayerIdInSupabase(event.to.userId, externalUserId);
        }
      });

      isInitialized = true;

    } catch (error) {
      console.error('OneSignal Native: Initialization error:', error);
    }
  }, { once: true });
}

// Inicialização Web Push
async function initWebPush(APP_ID: string, externalUserId?: string) {
  try {
    if (import.meta.env.DEV) {
      console.log('OneSignal Web: Initializing with APP_ID:', APP_ID.substring(0, 8) + '...');
    }

    // Carregar SDK Web do OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.init({
        appId: APP_ID,
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
        notifyButton: {
          enable: false, // Não mostrar botão padrão
        },
        serviceWorkerParam: {
          scope: '/'
        },
        serviceWorkerPath: '/OneSignalSDKWorker.js'
      });

      // Configurar external user ID
      if (externalUserId) {
        currentExternalUserId = externalUserId;
        if (import.meta.env.DEV) {
          console.log('OneSignal Web: Setting external user ID:', externalUserId);
        }
        await OneSignal.login(externalUserId);
      }

      // Obter player ID e salvar no Supabase
      const playerId = await OneSignal.User.PushSubscription.id;
      if (playerId && externalUserId) {
        if (import.meta.env.DEV) {
          console.log('OneSignal Web: Got Player ID:', playerId);
        }
        updatePlayerIdInSupabase(playerId, externalUserId);
      }

      // Listener para mudanças de subscription
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event.current.id && externalUserId) {
          if (import.meta.env.DEV) {
            console.log('OneSignal Web: Subscription changed, updating Player ID');
          }
          updatePlayerIdInSupabase(event.current.id, externalUserId);
        }
      });

      // Listener para notificações clicadas
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        if (import.meta.env.DEV) {
          console.log('OneSignal Web: Notification clicked:', event);
        }
        handleNotificationAction(event.notification.additionalData);
      });

      isInitialized = true;
      if (import.meta.env.DEV) {
        console.log('OneSignal Web: Initialized successfully');
      }
    });

    // Carregar script do OneSignal se ainda não estiver carregado
    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }

  } catch (error) {
    console.error('OneSignal Web: Initialization error:', error);
  }
}

// Utilitárias para controle de push
export function enablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(true);
    if (import.meta.env.DEV) {
      console.log('OneSignal Native: Push enabled');
    }
  } catch (error) {
    console.error('OneSignal Native: Error enabling push:', error);
  }
}

export function disablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(false);
    if (import.meta.env.DEV) {
      console.log('OneSignal Native: Push disabled');
    }
  } catch (error) {
    console.error('OneSignal Native: Error disabling push:', error);
  }
}

export function clearExternalUserId(): void {
  if (!isInitialized) return;
  
  try {
    if (isMobileApp() && window.plugins?.OneSignal) {
      const OneSignal = window.plugins.OneSignal;
      OneSignal.removeExternalUserId?.();
      if (import.meta.env.DEV) {
        console.log('OneSignal Native: External user ID cleared');
      }
    } else if (window.OneSignal) {
      window.OneSignal.logout();
      if (import.meta.env.DEV) {
        console.log('OneSignal Web: User logged out');
      }
    }
    currentExternalUserId = null;
  } catch (error) {
    console.error('OneSignal: Error clearing external user ID:', error);
  }
}

export function getDeviceState(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isInitialized || !window.plugins?.OneSignal) {
      reject(new Error('OneSignal not initialized'));
      return;
    }
    
    try {
      const OneSignal = window.plugins.OneSignal;
      OneSignal.getDeviceState((state: any) => {
        if (import.meta.env.DEV) {
          console.log('OneSignal Native: Device state:', state);
        }
        resolve(state);
      });
    } catch (error) {
      console.error('OneSignal Native: Error getting device state:', error);
      reject(error);
    }
  });
}

// Atualizar Player ID no Supabase
async function updatePlayerIdInSupabase(playerId: string, userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (import.meta.env.DEV) {
        console.log(`OneSignal Native: Updating player ID in Supabase (attempt ${attempt}):`, playerId);
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerId })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error(`OneSignal Native: Error updating player ID (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      if (import.meta.env.DEV) {
        console.log('OneSignal Native: Player ID successfully saved to Supabase:', data);
      }
      return;
      
    } catch (error) {
      console.error(`OneSignal Native: Error updating player ID in Supabase (attempt ${attempt}):`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}

// Handler para ações de notificação
function handleNotificationAction(additionalData: any) {
  if (!additionalData) return;

  const { route, deep_link, type } = additionalData;
  
  // Navegar baseado no tipo de notificação
  if (route) {
    window.location.href = route;
  } else if (deep_link) {
    window.location.href = deep_link;
  } else if (type) {
    // Navegação baseada no tipo
    switch (type) {
      case 'teacher_announcement':
        window.location.href = '/';
        break;
      case 'new_lesson':
        window.location.href = '/?tab=members';
        break;
      case 'workout_reminder':
        window.location.href = '/?tab=workouts';
        break;
      case 'nutrition_reminder':
        window.location.href = '/?tab=nutrition';
        break;
      case 'appointment_reminder':
        window.location.href = '/agenda';
        break;
      case 'chat_message':
        window.location.href = '/chat';
        break;
      default:
        window.location.href = '/';
        break;
    }
  } else {
    // Fallback para home
    window.location.href = '/';
  }
}