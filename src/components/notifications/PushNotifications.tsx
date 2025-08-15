import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    plugins: {
      OneSignal: any;
    };
  }
}

export const PushNotifications = () => {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('OneSignal: Not on native platform, skipping initialization');
      return;
    }

    initializeOneSignal();
  }, [user]);

  const initializeOneSignal = async () => {
    try {
      if (!window.plugins?.OneSignal) {
        console.log('OneSignal: Plugin not available');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      
      // Initialize with App ID from environment/secrets
      const appId = process.env.ONESIGNAL_APP_ID || 'your-onesignal-app-id';
      
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
        });
        
        // Complete with notification to show it
        notificationReceivedEvent.complete(notification);
      });

      // Handle notification tap
      OneSignal.setNotificationOpenedHandler((result: any) => {
        console.log('OneSignal: Notification opened:', result);
        
        const { notification } = result;
        const { additionalData } = notification;
        
        // Handle deep linking based on notification data
        if (additionalData?.route) {
          // You can implement navigation here
          console.log('Navigate to:', additionalData.route);
        }
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

  const updatePlayerIdInSupabase = async (playerId: string) => {
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onesignal_player_id: playerId,
          push_enabled: true 
        })
        .eq('id', user.id);

      if (error) {
        console.error('OneSignal: Error updating player ID:', error);
      } else {
        console.log('OneSignal: Player ID updated successfully');
      }
    } catch (error) {
      console.error('OneSignal: Error updating player ID in Supabase:', error);
    }
  };

  return null;
};