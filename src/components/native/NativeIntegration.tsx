import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { logger } from '@/utils/logger';

/**
 * Shape Pro - Native Integration Component
 * Gerencia integrações nativas do Capacitor (exceto notificações)
 * NOTA: Notificações são gerenciadas pelo OneSignal via src/lib/push.ts
 */
export const NativeIntegration = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      logger.log('[NativeIntegration] Running on web platform');
      return;
    }

    initNativeFeatures();
  }, []);

  const initNativeFeatures = async () => {
    try {
      logger.log('[NativeIntegration] Initializing native features...');

      // 1. Configure Status Bar
      await configureStatusBar();

      // 2. Configure Keyboard
      await configureKeyboard();

      // 3. Hide Splash Screen
      await hideSplashScreen();

      logger.log('[NativeIntegration] All native features initialized successfully');
    } catch (error) {
      logger.error('[NativeIntegration] Error initializing native features:', error);
    }
  };

  const configureStatusBar = async () => {
    try {
      // Set dark status bar for Shape Pro dark theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await StatusBar.show();
      
      logger.log('[NativeIntegration] Status bar configured');
    } catch (error) {
      logger.error('[NativeIntegration] Error configuring status bar:', error);
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

      logger.log('[NativeIntegration] Keyboard listeners configured');
    } catch (error) {
      logger.error('[NativeIntegration] Error configuring keyboard:', error);
    }
  };

  const hideSplashScreen = async () => {
    try {
      // Hide splash screen after app is loaded
      await SplashScreen.hide();
      logger.log('[NativeIntegration] Splash screen hidden');
    } catch (error) {
      logger.error('[NativeIntegration] Error hiding splash screen:', error);
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