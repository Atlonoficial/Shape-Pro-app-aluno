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
  // Hardcoded temporariamente para garantir disponibilidade em produção
  const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82";
  
  if (!APP_ID) {
    console.warn('[OneSignal] APP_ID not configured');
    return;
  }

  console.debug('[OneSignal] Initializing push notifications...');

  // Inicializar Web ou Mobile baseado no ambiente
  if (isMobileApp()) {
    initMobilePush(APP_ID, externalUserId);
  } else {
    initWebPush(APP_ID, externalUserId);
  }
}

// Inicialização Mobile (Cordova/Capacitor)
function initMobilePush(APP_ID: string, externalUserId?: string) {
  console.debug('[OneSignal Mobile] Starting initialization...');
  
  setTimeout(async () => {
    try {
      if (!window.plugins?.OneSignal) {
        console.warn('[OneSignal Mobile] Plugin not available - push disabled (non-fatal)');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      console.debug('[OneSignal Mobile] Plugin found, initializing...');
      
      OneSignal.setAppId(APP_ID);

      // ✅ BUILD 24: Solicitar permissão de forma unificada
      console.debug('[OneSignal] 📱 Requesting notification permission...');
      
      OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
        if (accepted) {
          console.debug('[OneSignal] ✅ Push notifications enabled');
          
          // Definir external user ID após aceitar
          if (externalUserId) {
            currentExternalUserId = externalUserId;
            OneSignal.setExternalUserId(String(externalUserId));
            console.debug('[OneSignal] User ID set:', externalUserId);
          }

          // Sincronizar playerId no backend
          OneSignal.getDeviceState((state: any) => {
            const playerId = state?.userId;
            if (playerId && externalUserId) {
              console.debug('[OneSignal] Got Player ID:', playerId);
              updatePlayerIdInSupabase(playerId, externalUserId);
            }
          });
        } else {
          console.debug('[OneSignal] ❌ User denied push notifications');
        }
      });

      // Handler para notificações em foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        console.debug('[OneSignal] Notification received in foreground');
        const notification = notificationReceivedEvent.getNotification();
        notificationReceivedEvent.complete(notification);
      });

      // Handler para quando notificação é tocada
      OneSignal.setNotificationOpenedHandler((result: any) => {
        console.debug('[OneSignal] Notification opened:', result);
        const { notification } = result;
        handleNotificationAction(notification.additionalData);
      });

      // Listener para mudanças de subscription
      OneSignal.addSubscriptionObserver((event: any) => {
        if (event.to.userId && externalUserId) {
          console.debug('[OneSignal] Subscription changed, updating Player ID');
          updatePlayerIdInSupabase(event.to.userId, externalUserId);
        }
      });

      isInitialized = true;
      console.debug('[OneSignal Mobile] ✅ Initialized successfully');

    } catch (error) {
      console.error('[OneSignal Mobile] ❌ Init failed (non-fatal):', error);
    }
  }, 500); // ✅ BUILD 24: 500ms delay
}

// Inicialização Web Push
async function initWebPush(APP_ID: string, externalUserId?: string) {
  try {
    console.debug('OneSignal Web: Initializing with APP_ID:', APP_ID.substring(0, 8) + '...');

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
        console.debug('OneSignal Web: Setting external user ID:', externalUserId);
        await OneSignal.login(externalUserId);
      }

      // Obter player ID e salvar no Supabase
      const playerId = await OneSignal.User.PushSubscription.id;
      if (playerId && externalUserId) {
        console.debug('OneSignal Web: Got Player ID:', playerId);
        updatePlayerIdInSupabase(playerId, externalUserId);
      }

      // Listener para mudanças de subscription
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event.current.id && externalUserId) {
          console.debug('OneSignal Web: Subscription changed, updating Player ID');
          updatePlayerIdInSupabase(event.current.id, externalUserId);
        }
      });

      // Listener para notificações clicadas
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.debug('OneSignal Web: Notification clicked:', event);
        handleNotificationAction(event.notification.additionalData);
      });

      isInitialized = true;
      console.debug('OneSignal Web: Initialized successfully');
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
    console.debug('OneSignal Native: Push enabled');
  } catch (error) {
    console.error('OneSignal Native: Error enabling push:', error);
  }
}

export function disablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(false);
    console.debug('OneSignal Native: Push disabled');
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
      console.debug('OneSignal Native: External user ID cleared');
    } else if (window.OneSignal) {
      window.OneSignal.logout();
      console.debug('OneSignal Web: User logged out');
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
        console.debug('OneSignal Native: Device state:', state);
        resolve(state);
      });
    } catch (error) {
      console.error('OneSignal Native: Error getting device state:', error);
      reject(error);
    }
  });
}

// Atualizar Player ID no Supabase - Build 26: 5 retries com feedback melhor
async function updatePlayerIdInSupabase(playerId: string, userId: string, maxRetries = 5) {
  console.debug(`[OneSignal] 🔄 BUILD 29: Starting player ID update`, {
    playerId,
    userId,
    timestamp: new Date().toISOString()
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.debug(`[OneSignal] 📝 Attempt ${attempt}/${maxRetries}: Updating Supabase...`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerId })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error(`[OneSignal] ❌ Error on attempt ${attempt}:`, {
          error: error.message,
          code: error.code,
          details: error.details
        });
        
        if (attempt === maxRetries) {
          console.error('[OneSignal] 🚨 All retry attempts failed!');
          throw error;
        }
        
        const waitTime = 1000 * attempt;
        console.debug(`[OneSignal] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      console.debug('[OneSignal] ✅ Player ID successfully saved to Supabase:', {
        playerId,
        userId,
        data,
        attempt
      });
      return;
      
    } catch (error) {
      console.error(`[OneSignal] 💥 Exception on attempt ${attempt}:`, error);
      
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.debug(`[OneSignal] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('[OneSignal] 🚨 Final attempt failed - giving up');
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