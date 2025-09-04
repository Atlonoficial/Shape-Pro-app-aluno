import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initOneSignalWeb } from '@/lib/oneSignalWeb';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    plugins: {
      OneSignal: any;
    };
  }
}

// Get OneSignal App ID from environment or use fallback
const getOneSignalAppId = async (): Promise<string> => {
  try {
    const { data } = await supabase.functions.invoke('get-onesignal-config');
    if (data?.appId) {
      return data.appId;
    }
  } catch (error) {
    console.warn('Could not fetch OneSignal config:', error);
  }
  
  // Fallback para o ID padrão de desenvolvimento
  return '1af0b3d5-8b2a-4c75-9e6f-3a4b5c6d7e8f';
};

export const PushNotifications = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      console.log('OneSignal: Initializing for native platform');
      initializeOneSignal();
    } else {
      console.log('OneSignal: Initializing for web platform');
      if (user?.id) {
        initOneSignalWeb(user.id);
      }
    }
  }, [user]);

  const initializeOneSignal = async () => {
    try {
      if (!window.plugins?.OneSignal) {
        console.log('OneSignal: Plugin not available');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      
      // Initialize with App ID
      const appId = await getOneSignalAppId();
      console.log('OneSignal Native: Using App ID:', appId.substring(0, 8) + '...');
      
      OneSignal.setAppId(appId);
      
      // Request permission for notifications
      OneSignal.promptForPushNotificationsWithUserResponse((response: any) => {
        console.log('OneSignal: Prompt response:', response);
      });

      // Handle notification received while app is in foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent: any) => {
        console.log('OneSignal: Notification received in foreground:', notificationReceivedEvent);
        
        const notification = notificationReceivedEvent.getNotification();
        
        // Show toast for in-app notifications
        toast(notification.title, {
          description: notification.body,
          action: {
            label: 'Ver',
            onClick: () => handleNotificationAction(notification.additionalData)
          }
        });
        
        // Complete with notification to show it
        notificationReceivedEvent.complete(notification);
      });

      // Handle notification tap
      OneSignal.setNotificationOpenedHandler((result: any) => {
        console.log('OneSignal: Notification opened:', result);
        
        const { notification } = result;
        const { additionalData } = notification;
        
        handleNotificationAction(additionalData);
      });

      // Get the player ID and save to Supabase
      OneSignal.getDeviceState((deviceState: any) => {
        if (deviceState.userId && user?.id) {
          updatePlayerIdInSupabase(deviceState.userId);
        }
      });

      // Listen for player ID changes
      OneSignal.addSubscriptionObserver((event: any) => {
        if (event.to.userId && user?.id) {
          updatePlayerIdInSupabase(event.to.userId);
        }
      });

    } catch (error) {
      console.error('OneSignal: Error initializing:', error);
    }
  };

  const handleNotificationAction = (additionalData: any) => {
    if (!additionalData) return;

    const { route, deep_link, type } = additionalData;
    
    // Navegar baseado no tipo de notificação
    if (route) {
      navigate(route);
    } else if (deep_link) {
      window.location.href = deep_link;
    } else if (type) {
      // Navegação baseada no tipo
      switch (type) {
        case 'teacher_announcement':
          navigate('/');
          break;
        case 'new_lesson':
          navigate('/?tab=members');
          break;
        case 'workout_reminder':
          navigate('/?tab=workouts');
          break;
        case 'nutrition_reminder':
          navigate('/?tab=nutrition');
          break;
        case 'appointment_reminder':
          navigate('/agenda');
          break;
        case 'chat_message':
          navigate('/chat');
          break;
        default:
          navigate('/');
          break;
      }
    } else {
      // Fallback para home
      navigate('/');
    }
  };

  const updatePlayerIdInSupabase = async (playerId: string, maxRetries = 3) => {
    if (!user?.id) {
      console.error('OneSignal Native: No user ID available');
      return;
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`OneSignal Native: Updating player ID in Supabase (attempt ${attempt}):`, playerId);
        
        const { data, error } = await supabase
          .from('profiles')
          .update({ onesignal_player_id: playerId })
          .eq('id', user.id)
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
        
        // Verificar se foi salvo corretamente
        const { data: verifyData } = await supabase
          .from('profiles')
          .select('onesignal_player_id')
          .eq('id', user.id)
          .single();
        
        if (verifyData?.onesignal_player_id === playerId) {
          console.log('OneSignal Native: Player ID verification successful');
        } else {
          console.warn('OneSignal Native: Player ID verification failed');
        }
        
        return;
        
      } catch (error) {
        console.error(`OneSignal Native: Error updating player ID in Supabase (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          console.error('OneSignal Native: Failed to save Player ID after', maxRetries, 'attempts');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  };

  return null;
};