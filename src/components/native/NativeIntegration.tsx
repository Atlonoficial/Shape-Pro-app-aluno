import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Shape Pro - Native Integration Component
 * Gerencia todas as integrações nativas do Capacitor
 */
export const NativeIntegration = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[NativeIntegration] Running on web platform');
      return;
    }

    initNativeFeatures();
  }, []);

  const initNativeFeatures = async () => {
    try {
      console.log('[NativeIntegration] Initializing native features...');

      // 1. Configure Status Bar
      await configureStatusBar();

      // 2. Configure Keyboard
      await configureKeyboard();

      // 3. Hide Splash Screen
      await hideSplashScreen();

      // 4. Initialize Push Notifications
      await initPushNotifications();

      console.log('[NativeIntegration] All native features initialized successfully');
    } catch (error) {
      console.error('[NativeIntegration] Error initializing native features:', error);
    }
  };

  const configureStatusBar = async () => {
    try {
      // Set dark status bar for Shape Pro dark theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await StatusBar.show();
      
      console.log('[NativeIntegration] Status bar configured');
    } catch (error) {
      console.error('[NativeIntegration] Error configuring status bar:', error);
    }
  };

  const configureKeyboard = async () => {
    try {
      // Configure keyboard for better UX in forms
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });

      console.log('[NativeIntegration] Keyboard listeners configured');
    } catch (error) {
      console.error('[NativeIntegration] Error configuring keyboard:', error);
    }
  };

  const hideSplashScreen = async () => {
    try {
      // Hide splash screen after app is loaded
      await SplashScreen.hide();
      console.log('[NativeIntegration] Splash screen hidden');
    } catch (error) {
      console.error('[NativeIntegration] Error hiding splash screen:', error);
    }
  };

  const initPushNotifications = async () => {
    try {
      // Request permissions for push notifications
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();

        // Add listeners for push notification events
        PushNotifications.addListener('registration', (token) => {
          console.log('[NativeIntegration] Push registration token:', token.value);
          // TODO: Send token to your backend server
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[NativeIntegration] Push registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[NativeIntegration] Push notification received:', notification);
          // TODO: Handle notification received while app is open
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[NativeIntegration] Push notification action performed:', notification);
          // TODO: Handle notification tap/action
        });

        console.log('[NativeIntegration] Push notifications initialized');
      } else {
        console.log('[NativeIntegration] Push notification permission denied');
      }
    } catch (error) {
      console.error('[NativeIntegration] Error initializing push notifications:', error);
    }
  };

  // This component doesn't render anything - it's just for side effects
  return null;
};

/**
 * CSS Classes for keyboard handling
 * Add these to your global CSS:
 * 
 * .keyboard-open {
 *   padding-bottom: 0;
 * }
 * 
 * .keyboard-open .bottom-navigation {
 *   transform: translateY(100%);
 * }
 */