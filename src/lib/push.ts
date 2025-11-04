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
let webInitialized = false; // ✅ BUILD 54: Guard para prevenir re-inicialização do SDK Web

// Detectar se é mobile (Capacitor/Cordova) ou web
const isMobileApp = () => {
  return !!window.device || !!window.cordova;
};

export async function initPush(externalUserId?: string) {
  // Hardcoded temporariamente para garantir disponibilidade em produção
  const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82";
  
  if (!APP_ID) {
    logger.error('OneSignal', 'APP_ID not configured - check .env file');
    logger.warn('OneSignal', 'See docs/ONESIGNAL_CONFIG.md for setup');
    return;
  }

  const platform = isMobileApp() ? 'Mobile (Cordova)' : 'Web';
  logger.info('OneSignal', `Starting initialization on ${platform}`, {
    appId: APP_ID.substring(0, 8) + '...',
    externalUserId: externalUserId ? externalUserId.substring(0, 8) + '...' : 'not provided'
  });

  // Inicializar Web ou Mobile baseado no ambiente
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

      // ✅ BUILD 53: Definir external user ID (permissão será pedida pelo modal)
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

      // ✅ BUILD 53: Disparar evento customizado para notificar componentes
      window.dispatchEvent(new CustomEvent('onesignal-ready', { 
        detail: { platform: 'mobile', externalUserId } 
      }));

    } catch (error) {
      logger.error('OneSignal Mobile', 'Init failed (non-fatal)', error);
    }
  }, 500); // ✅ BUILD 24: 500ms delay
}

// Inicialização Web Push
async function initWebPush(APP_ID: string, externalUserId?: string) {
  // ✅ BUILD 54: Prevenir re-inicialização do SDK Web
  if (webInitialized) {
    logger.warn('OneSignal Web', 'Already initialized, skipping');
    return;
  }
  
  try {
    webInitialized = true;
    logger.debug('OneSignal Web', 'Initializing', { appId: APP_ID.substring(0, 8) + '...' });

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
        logger.debug('OneSignal Web', 'Setting external user ID', { externalUserId });
        await OneSignal.login(externalUserId);
      }

      // Obter player ID com retry (pode não estar disponível imediatamente)
      let playerId = await OneSignal.User.PushSubscription.id;

      if (!playerId && externalUserId) {
        logger.debug('OneSignal Web', 'Player ID not available, retrying in 2s');
        await new Promise(resolve => setTimeout(resolve, 2000));
        playerId = await OneSignal.User.PushSubscription.id;
      }

      if (playerId && externalUserId) {
        logger.info('OneSignal Web', 'Player ID obtained', { playerId });
        updatePlayerIdInSupabase(playerId, externalUserId);
      } else {
        logger.warn('OneSignal Web', 'No Player ID after retry', {
          hasPlayerId: !!playerId,
          hasExternalUserId: !!externalUserId
        });
      }

      // Listener para mudanças de subscription
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event.current.id && externalUserId) {
          logger.debug('OneSignal Web', 'Subscription changed, updating Player ID');
          updatePlayerIdInSupabase(event.current.id, externalUserId);
        }
      });

      // Listener para notificações clicadas
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        logger.debug('OneSignal Web', 'Notification clicked', event);
        handleNotificationAction(event.notification.additionalData);
      });

      isInitialized = true;
      logger.info('OneSignal Web', 'Initialized successfully');
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
    webInitialized = false; // ✅ Reset se falhar para permitir retry
    logger.error('OneSignal Web', 'Initialization error', error);
  }
}

// Utilitárias para controle de push
export function enablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(true);
    logger.debug('OneSignal Native', 'Push enabled');
  } catch (error) {
    logger.error('OneSignal Native', 'Error enabling push', error);
  }
}

export function disablePush(): void {
  if (!isInitialized || !window.plugins?.OneSignal) return;
  
  try {
    const OneSignal = window.plugins.OneSignal;
    OneSignal.setPushSubscription?.(false);
    logger.debug('OneSignal Native', 'Push disabled');
  } catch (error) {
    logger.error('OneSignal Native', 'Error disabling push', error);
  }
}

export function clearExternalUserId(): void {
  if (!isInitialized) return;
  
  try {
    if (isMobileApp() && window.plugins?.OneSignal) {
      const OneSignal = window.plugins.OneSignal;
      OneSignal.removeExternalUserId?.();
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
  return new Promise((resolve, reject) => {
    if (!isInitialized || !(window as any).plugins?.OneSignal) {
      reject(new Error('OneSignal not initialized'));
      return;
    }
    
    try {
      const OneSignal = (window as any).plugins.OneSignal;
      OneSignal.getDeviceState((state: any) => {
        logger.debug('OneSignal Native', 'Device state', state);
        resolve(state);
      });
    } catch (error) {
      logger.error('OneSignal Native', 'Error getting device state', error);
      reject(error);
    }
  });
}

// Verificar permissão de notificação do sistema operacional
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    // Web
    if ('Notification' in window) {
      logger.debug('OneSignal Web', 'Notification permission', { permission: Notification.permission });
      return Notification.permission;
    }
    
    // Mobile - verificar via OneSignal
    if ((window as any).plugins?.OneSignal && isInitialized) {
      const state = await getDeviceState();
      const hasPermission = state?.hasNotificationPermission || state?.notificationPermissionStatus === 1;
      logger.debug('OneSignal Native', 'Notification permission', { 
        hasPermission,
        state 
      });
      return hasPermission ? 'granted' : 'denied';
    }
    
    logger.warn('OneSignal', 'Cannot check permission - OneSignal not available');
    return 'default';
  } catch (error) {
    logger.error('OneSignal', 'Error checking notification permission', error);
    return 'default';
  }
}

// Atualizar Player ID no Supabase - Build 31: Validação de profile + detecção RLS
async function updatePlayerIdInSupabase(playerId: string, userId: string, maxRetries = 5) {
  logger.debug('OneSignal', 'Starting player ID update', { playerId, userId });

  // ✅ NOVO: Verificar se profile existe primeiro
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    logger.error('OneSignal', 'Profile not found', profileError);
    return;
  }

  logger.debug('OneSignal', 'Profile found', { email: profile.email });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('OneSignal', `Attempt ${attempt}/${maxRetries}: Updating Supabase`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerId })
        .eq('id', userId)
        .select();
      
      if (error) {
        logger.error('OneSignal', `Error on attempt ${attempt}`, error);
        
        // ✅ NOVO: Detectar erros de RLS (não vale retry)
        if (error.code === 'PGRST116' || error.code === '42501') {
          logger.critical('OneSignal', 'RLS POLICY ERROR - Check profiles table policies');
          return; // Não adianta tentar novamente
        }
        
        if (attempt === maxRetries) {
          logger.error('OneSignal', 'All retry attempts failed');
          throw error;
        }
        
        const waitTime = 1000 * attempt;
        logger.debug('OneSignal', `Waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      logger.info('OneSignal', 'Player ID saved successfully', {
        playerId,
        rowsAffected: data?.length || 0
      });
      
      // ✅ BUILD 32: Toast de confirmação para o usuário
      toast.success('🔔 Notificações ativadas!', {
        description: 'Você receberá lembretes de treinos e avisos importantes.',
        duration: 4000
      });
      
      return;
      
    } catch (error: any) {
      logger.error('OneSignal', `Exception on attempt ${attempt}`, error);
      
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        await new Promise(resolve => setTimeout(resolve, waitTime));
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