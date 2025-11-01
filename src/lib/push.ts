// src/lib/push.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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

const PUSH_PERMISSION_KEY = 'push_permission_asked';
const PUSH_PROMPT_DELAY = 5000; // 5 seconds

// Detectar se é mobile (Capacitor/Cordova) ou web
const isMobileApp = () => {
  return !!window.device || !!window.cordova;
};

export async function initPush(externalUserId?: string) {
  const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!APP_ID) {
    logger.warn('OneSignal: APP_ID not configured');
    return;
  }

  // Inicializar Web ou Mobile baseado no ambiente
  if (isMobileApp()) {
    initMobilePush(APP_ID, externalUserId);
  } else {
    initWebPush(APP_ID, externalUserId);
  }
}

// Solicitar permissão de notificação automaticamente no primeiro acesso
export async function promptForPermissionOnFirstAccess() {
  const hasAsked = localStorage.getItem(PUSH_PERMISSION_KEY);
  if (hasAsked) {
    logger.log('Push permission already asked, skipping prompt');
    return;
  }

  // Aguardar 5 segundos após o login
  await new Promise(resolve => setTimeout(resolve, PUSH_PROMPT_DELAY));

  try {
    if (isMobileApp() && window.plugins?.OneSignal) {
      const OneSignal = window.plugins.OneSignal;
      
      // iOS: solicitar permissão explicitamente
      if (window.device?.platform === 'iOS') {
        OneSignal.Notifications?.requestPermission?.(true, (accepted: boolean) => {
          logger.log(`Push permission ${accepted ? 'granted' : 'denied'}`);
          localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
        });
      } else {
        // Android: usar método padrão
        OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
          logger.log(`Push permission ${accepted ? 'granted' : 'denied'}`);
          localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
        });
      }
    } else if (window.OneSignal) {
      // Web: solicitar permissão
      const permission = await window.OneSignal.Notifications.requestPermission();
      logger.log(`Push permission ${permission ? 'granted' : 'denied'}`);
      localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
    }
  } catch (error) {
    logger.error('Error requesting push permission:', error);
    localStorage.setItem(PUSH_PERMISSION_KEY, 'true'); // Não pedir novamente mesmo em caso de erro
  }
}

// Inicialização Mobile (Cordova/Capacitor)
function initMobilePush(APP_ID: string, externalUserId?: string) {
  document.addEventListener('deviceready', async () => {
    try {
      if (!window.plugins?.OneSignal) {
        logger.warn('OneSignal: Plugin not available');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      logger.log('OneSignal Native: Initializing...');
      
      OneSignal.setAppId(APP_ID);

      // Definir external user ID se disponível
      if (externalUserId) {
        currentExternalUserId = externalUserId;
        logger.log('OneSignal Native: Setting external user ID');
        OneSignal.setExternalUserId(String(externalUserId));
      }

      // Sincronizar playerId no backend
      OneSignal.getDeviceState((state: any) => {
        const playerId = state?.userId;
        if (playerId && externalUserId) {
          logger.log('OneSignal Native: Got Player ID');
          updatePlayerIdInSupabase(playerId, externalUserId);
        }
      });

      // Handler para notificações em foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        logger.log('OneSignal Native: Notification received in foreground');
        const notification = notificationReceivedEvent.getNotification();
        notificationReceivedEvent.complete(notification);
      });

      // Handler para quando notificação é tocada
      OneSignal.setNotificationOpenedHandler((result: any) => {
        logger.log('OneSignal Native: Notification opened');
        const { notification } = result;
        handleNotificationAction(notification.additionalData);
      });

      // Listener para mudanças de subscription
      OneSignal.addSubscriptionObserver((event: any) => {
        if (event.to.userId && externalUserId) {
          logger.log('OneSignal Native: Subscription changed');
          updatePlayerIdInSupabase(event.to.userId, externalUserId);
        }
      });

      isInitialized = true;

    } catch (error) {
      logger.error('OneSignal Native: Initialization error:', error);
    }
  }, { once: true });
}

// Inicialização Web Push
async function initWebPush(APP_ID: string, externalUserId?: string) {
  try {
    logger.log('OneSignal Web: Initializing...');

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
        logger.log('OneSignal Web: Setting external user ID');
        await OneSignal.login(externalUserId);
      }

      // Obter player ID e salvar no Supabase
      const playerId = await OneSignal.User.PushSubscription.id;
      if (playerId && externalUserId) {
        logger.log('OneSignal Web: Got Player ID');
        updatePlayerIdInSupabase(playerId, externalUserId);
      }

      // Listener para mudanças de subscription
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event.current.id && externalUserId) {
          logger.log('OneSignal Web: Subscription changed');
          updatePlayerIdInSupabase(event.current.id, externalUserId);
        }
      });

      // Listener para notificações clicadas
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        logger.log('OneSignal Web: Notification clicked');
        handleNotificationAction(event.notification.additionalData);
      });

      isInitialized = true;
      logger.log('OneSignal Web: Initialized successfully');
    });

    // Carregar script do OneSignal APENAS no WEB (nunca em mobile)
    if (!document.getElementById('onesignal-sdk') && !isMobileApp()) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
      logger.log('OneSignal Web: SDK script loaded');
    }

  } catch (error) {
    logger.error('OneSignal Web: Initialization error:', error);
  }
}

// Utilitárias para controle de push
export function enablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(true);
    logger.log('Push enabled');
  } catch (error) {
    logger.error('Error enabling push:', error);
  }
}

export function disablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(false);
    logger.log('Push disabled');
  } catch (error) {
    logger.error('Error disabling push:', error);
  }
}

export function clearExternalUserId(): void {
  if (!isInitialized) return;
  
  try {
    if (isMobileApp() && window.plugins?.OneSignal) {
      const OneSignal = window.plugins.OneSignal;
      OneSignal.removeExternalUserId?.();
      logger.log('External user ID cleared');
    } else if (window.OneSignal) {
      window.OneSignal.logout();
      logger.log('User logged out');
    }
    currentExternalUserId = null;
  } catch (error) {
    logger.error('Error clearing external user ID:', error);
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
        logger.log('Device state retrieved');
        resolve(state);
      });
    } catch (error) {
      logger.error('Error getting device state:', error);
      reject(error);
    }
  });
}

// Atualizar Player ID no Supabase
async function updatePlayerIdInSupabase(playerId: string, userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`Updating player ID in Supabase (attempt ${attempt})`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerId })
        .eq('id', userId)
        .select();
      
      if (error) {
        logger.error(`Error updating player ID (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      logger.log('Player ID successfully saved to Supabase');
      return;
      
    } catch (error) {
      logger.error(`Error updating player ID in Supabase (attempt ${attempt}):`, error);
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