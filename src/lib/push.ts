// src/lib/push.ts
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    plugins: {
      OneSignal: any;
    };
  }
}

export async function initPush(externalUserId?: string) {
  const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!APP_ID) {
    console.warn('OneSignal: APP_ID not configured');
    return;
  }

  document.addEventListener('deviceready', async () => {
    try {
      if (!window.plugins?.OneSignal) {
        console.log('OneSignal: Plugin not available');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      console.log('OneSignal Native: Initializing with APP_ID:', APP_ID.substring(0, 8) + '...');
      
      OneSignal.setAppId(APP_ID);

      // iOS: solicita permissão
      OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
        console.log('OneSignal Native: Push permission:', accepted ? 'granted' : 'denied');
      });

      // Definir external user ID se disponível
      if (externalUserId) {
        console.log('OneSignal Native: Setting external user ID:', externalUserId);
        OneSignal.setExternalUserId(String(externalUserId));
      }

      // Sincronizar playerId no backend
      OneSignal.getDeviceState((state: any) => {
        const playerId = state?.userId;
        if (playerId && externalUserId) {
          console.log('OneSignal Native: Got Player ID:', playerId);
          updatePlayerIdInSupabase(playerId, externalUserId);
        }
      });

      // Handler para notificações em foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        console.log('OneSignal Native: Notification received in foreground:', notificationReceivedEvent);
        const notification = notificationReceivedEvent.getNotification();
        notificationReceivedEvent.complete(notification);
      });

      // Handler para quando notificação é tocada
      OneSignal.setNotificationOpenedHandler((result: any) => {
        console.log('OneSignal Native: Notification opened:', result);
        const { notification } = result;
        handleNotificationAction(notification.additionalData);
      });

      // Listener para mudanças de subscription
      OneSignal.addSubscriptionObserver((event: any) => {
        if (event.to.userId && externalUserId) {
          console.log('OneSignal Native: Subscription changed, updating Player ID');
          updatePlayerIdInSupabase(event.to.userId, externalUserId);
        }
      });

    } catch (error) {
      console.error('OneSignal Native: Initialization error:', error);
    }
  }, { once: true });
}

// Atualizar Player ID no Supabase
async function updatePlayerIdInSupabase(playerId: string, userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OneSignal Native: Updating player ID in Supabase (attempt ${attempt}):`, playerId);
      
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
      
      console.log('OneSignal Native: Player ID successfully saved to Supabase:', data);
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