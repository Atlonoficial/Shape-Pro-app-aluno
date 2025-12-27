// src/lib/push.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from './logger';

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
let webInitialized = false;

// Detectar se é mobile (Capacitor/Cordova) ou web
const isMobileApp = () => {
  return !!window.device || !!window.cordova;
};

export async function initPush(externalUserId?: string) {
  const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "YOUR_ONESIGNAL_APP_ID";

  if (!APP_ID) {
    logger.error('OneSignal', 'APP_ID not configured');
    return;
  }

  const platform = isMobileApp() ? 'Mobile (Cordova)' : 'Web';
  logger.info('OneSignal', `Starting initialization on ${platform}`, {
    appId: APP_ID.substring(0, 8) + '...',
    externalUserId: externalUserId ? externalUserId.substring(0, 8) + '...' : 'not provided'
  });

  if (isMobileApp()) {
    initMobilePush(APP_ID, externalUserId);
  } else {
    initWebPush(APP_ID, externalUserId);
  }
}

// Inicialização Mobile (Cordova/Capacitor)
function initMobilePush(APP_ID: string, externalUserId?: string) {
  logger.debug('OneSignal Mobile', 'Starting initialization');

  setTimeout(async () => {
    try {
      if (!window.plugins?.OneSignal) {
        logger.warn('OneSignal Mobile', 'Plugin not available - push disabled (non-fatal)');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      logger.debug('OneSignal Mobile', 'Plugin found, initializing');

      OneSignal.setAppId(APP_ID);

      if (externalUserId) {
        currentExternalUserId = externalUserId;
        OneSignal.setExternalUserId(String(externalUserId));
        logger.debug('OneSignal', 'User ID set', { externalUserId });
      }

      // Handler para notificações em foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        logger.debug('OneSignal', 'Notification received in foreground');
        const notification = notificationReceivedEvent.getNotification();
        notificationReceivedEvent.complete(notification);
      });

      // Handler para quando notificação é tocada
      OneSignal.setNotificationOpenedHandler((result: any) => {
        logger.debug('OneSignal', 'Notification opened', result);
        const { notification } = result;
        handleNotificationAction(notification.additionalData);
      });

      // Listener para mudanças de subscription
      OneSignal.addSubscriptionObserver((event: any) => {
        if (event.to.userId && externalUserId) {
          logger.debug('OneSignal', 'Subscription changed, updating Player ID');
          updatePlayerIdInSupabase(event.to.userId, externalUserId);
        }
      });

      isInitialized = true;
      logger.info('OneSignal Mobile', 'Initialized successfully', {
        pluginAvailable: !!window.plugins?.OneSignal,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(new CustomEvent('onesignal-ready', {
        detail: { platform: 'mobile', externalUserId }
      }));

    } catch (error) {
      logger.error('OneSignal Mobile', 'Init failed (non-fatal)', error);
    }
  }, 500);
}

// Inicialização Web Push
async function initWebPush(APP_ID: string, externalUserId?: string) {
  if (webInitialized) {
    logger.warn('OneSignal Web', 'Already initialized, skipping');
    return;
  }

  try {
    webInitialized = true;
    logger.debug('OneSignal Web', 'Initializing', { appId: APP_ID.substring(0, 8) + '...' });

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: APP_ID,
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
        notifyButton: { enable: false },
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: '/OneSignalSDKWorker.js'
      });

      if (externalUserId) {
        currentExternalUserId = externalUserId;
        logger.debug('OneSignal Web', 'Setting external user ID', { externalUserId });
        await OneSignal.login(externalUserId);
      }

      let playerId = await OneSignal.User.PushSubscription.id;

      if (!playerId && externalUserId) {
        logger.debug('OneSignal Web', 'Player ID not available, retrying in 2s');
        await new Promise(resolve => setTimeout(resolve, 2000));
        playerId = await OneSignal.User.PushSubscription.id;
      }

      if (playerId && externalUserId) {
        logger.info('OneSignal Web', 'Player ID obtained', { playerId });
        updatePlayerIdInSupabase(playerId, externalUserId);
      }

      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event.current.id && externalUserId) {
          updatePlayerIdInSupabase(event.current.id, externalUserId);
        }
      });

      OneSignal.Notifications.addEventListener('click', (event: any) => {
        handleNotificationAction(event.notification.additionalData);
      });

      isInitialized = true;
      logger.info('OneSignal Web', 'Initialized successfully');
    });

    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }

  } catch (error) {
    webInitialized = false;
    logger.error('OneSignal', 'Error initializing', error);
  }
}

// ✅ BUILD 79: Função requestPermission corrigida para OneSignal v5
export async function requestPermission(): Promise<boolean> {
  try {
    logger.info('OneSignal', 'Requesting push notification permission...');
    
    if (isMobileApp() && window.plugins?.OneSignal) {
      const OneSignal = window.plugins.OneSignal;
      logger.debug('OneSignal', 'Using Cordova plugin v5');
      
      // ✅ OneSignal v5 API: Notifications.requestPermission()
      try {
        // Tentar nova API do OneSignal v5
        if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
          const accepted = await OneSignal.Notifications.requestPermission(true);
          logger.info('OneSignal', 'Permission response (v5 API)', { accepted });
          return accepted === true;
        }
        
        // Fallback para API legada (caso plugin antigo)
        if (typeof OneSignal.promptForPushNotificationsWithUserResponse === 'function') {
          return new Promise((resolve) => {
            OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
              logger.info('OneSignal', 'Permission response (legacy API)', { accepted });
              resolve(accepted);
            });
          });
        }

        // Se nenhuma API funcionar, verificar estado atual
        logger.warn('OneSignal', 'No permission API available, checking current state');
        const state = await getDeviceState();
        return state?.hasNotificationPermission === true;
        
      } catch (e) {
        logger.warn('OneSignal', 'Permission API error, trying fallback...', e);
        const state = await getDeviceState();
        return state?.hasNotificationPermission === true;
      }
    } else if (window.OneSignal) {
      // Web SDK
      logger.debug('OneSignal', 'Using Web SDK');
      await window.OneSignal.Notifications.requestPermission();
      return window.OneSignal.Notifications.permission === 'granted';
    }
    
    logger.warn('OneSignal', 'No OneSignal SDK available');
    return false;
  } catch (error) {
    logger.error('OneSignal', 'Error requesting permission', error);
    throw error;
  }
}

// ✅ Função enablePush
export async function enablePush(): Promise<void> {
  try {
    const permission = await checkNotificationPermission();
    if (permission !== 'granted') {
      await requestPermission();
    }

    if (isMobileApp() && window.plugins?.OneSignal) {
      window.plugins.OneSignal.disablePush(false);
    }
    logger.info('OneSignal', 'Push enabled');
  } catch (error) {
    logger.error('OneSignal', 'Error enabling push', error);
  }
}

export async function disablePush(): Promise<void> {
  try {
    if (isMobileApp() && window.plugins?.OneSignal) {
      window.plugins.OneSignal.disablePush(true);
      logger.debug('OneSignal Native', 'Push disabled');
    }
  } catch (error) {
    logger.error('OneSignal Native', 'Error disabling push', error);
  }
}

export function clearExternalUserId(): void {
  if (!isInitialized) return;

  try {
    if (isMobileApp() && window.plugins?.OneSignal) {
      window.plugins.OneSignal.removeExternalUserId?.();
      logger.debug('OneSignal Native', 'External user ID cleared');
    } else if (window.OneSignal) {
      window.OneSignal.logout();
      logger.debug('OneSignal Web', 'User logged out');
    }
    currentExternalUserId = null;
  } catch (error) {
    logger.error('OneSignal', 'Error clearing external user ID', error);
  }
}

export function getDeviceState(): Promise<any> {
  return new Promise((resolve) => {
    if (!isInitialized || !window.plugins?.OneSignal) {
      resolve(null);
      return;
    }

    try {
      window.plugins.OneSignal.getDeviceState((state: any) => {
        logger.debug('OneSignal Native', 'Device state', state);
        resolve(state);
      });
    } catch (error) {
      logger.error('OneSignal Native', 'Error getting device state', error);
      resolve(null);
    }
  });
}

export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    if ('Notification' in window && !isMobileApp()) {
      return Notification.permission;
    }

    if (isMobileApp() && window.plugins?.OneSignal) {
      const state = await getDeviceState();
      if (!state) return 'default';

      const hasPermission = state.hasNotificationPermission || 
                           state.notificationPermissionStatus === 1 || 
                           state.notificationPermissionStatus === 2;
      return hasPermission ? 'granted' : 'denied';
    }

    return 'default';
  } catch (error) {
    logger.error('OneSignal', 'Error checking notification permission', error);
    return 'default';
  }
}

async function updatePlayerIdInSupabase(playerId: string, userId: string, maxRetries = 5) {
  logger.debug('OneSignal', 'Starting player ID update', { playerId, userId });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    logger.error('OneSignal', 'Profile not found', profileError);
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerId })
        .eq('id', userId)
        .select();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42501') {
          logger.critical('OneSignal', 'RLS POLICY ERROR');
          return;
        }

        if (attempt === maxRetries) throw error;

        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      logger.info('OneSignal', 'Player ID saved successfully', { playerId });

      toast.success('🔔 Notificações ativadas!', {
        description: 'Você receberá lembretes de treinos e avisos importantes.',
        duration: 4000
      });

      return;
    } catch (error: any) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}

function handleNotificationAction(additionalData: any) {
  if (!additionalData) return;

  const { route, deep_link, type } = additionalData;

  if (route) {
    window.location.href = route;
  } else if (deep_link) {
    window.location.href = deep_link;
  } else if (type) {
    switch (type) {
      case 'teacher_announcement': window.location.href = '/'; break;
      case 'new_lesson': window.location.href = '/?tab=members'; break;
      case 'workout_reminder': window.location.href = '/?tab=workouts'; break;
      case 'nutrition_reminder': window.location.href = '/?tab=nutrition'; break;
      case 'appointment_reminder': window.location.href = '/agenda'; break;
      case 'chat_message': window.location.href = '/chat'; break;
      default: window.location.href = '/'; break;
    }
  } else {
    window.location.href = '/';
  }
}