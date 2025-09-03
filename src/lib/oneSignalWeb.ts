import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = '1af0b3d5-8b2a-4c75-9e6f-3a4b5c6d7e8f';

export const initOneSignalWeb = async (userId?: string) => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    console.log('OneSignal Web SDK not available');
    return;
  }

  try {
    await window.OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "OneSignalSDKWorker.js",
      notificationClickHandlerMatch: "origin",
      allowLocalhostAsSecureOrigin: true,
    });

    console.log('OneSignal Web SDK initialized');

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
      if (event.current.id && userId) {
        await updatePlayerIdInSupabase(event.current.id, userId);
      }
    });

    // Request permission
    await window.OneSignal.Slidedown.promptPush();

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