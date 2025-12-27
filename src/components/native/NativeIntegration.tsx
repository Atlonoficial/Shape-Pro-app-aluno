import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Prass Trainer - Native Integration Component
 * Gerencia todas as integrações nativas do Capacitor
 * ✅ BUILD 74: Corrigido initPush para passar userId corretamente
 */
export const NativeIntegration = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      logger.info('NativeIntegration', 'Running on web platform');
      return;
    }

    initNativeFeatures();
  }, []);

  const initNativeFeatures = async () => {
    try {
      logger.info('NativeIntegration', 'Initializing native features...');

      // 1. Configure Status Bar
      await configureStatusBar();

      // 2. Configure Keyboard
      await configureKeyboard();

      // 3. Splash screen gerenciado exclusivamente por main.tsx após React montar

      // 4. Initialize Push Notifications
      await initPushNotifications();

      logger.info('NativeIntegration', 'All native features initialized successfully');
    } catch (error) {
      logger.error('NativeIntegration', 'Error initializing native features:', error);
    }
  };

  const configureStatusBar = async () => {
    try {
      // Set dark status bar for Prass Trainer dark theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await StatusBar.show();

      logger.info('NativeIntegration', 'Status bar configured');
    } catch (error) {
      logger.error('NativeIntegration', 'Error configuring status bar:', error);
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

      logger.info('NativeIntegration', 'Keyboard listeners configured');
    } catch (error) {
      logger.error('NativeIntegration', 'Error configuring keyboard:', error);
    }
  };

  const initPushNotifications = async () => {
    try {
      logger.info('NativeIntegration', 'Initializing OneSignal Push Notifications...');
      const { initPush } = await import('@/lib/push');

      // ✅ BUILD 74: Buscar userId do usuário logado antes de inicializar push
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.id) {
        logger.info('NativeIntegration', 'User found, initializing push with userId:', user.id.substring(0, 8) + '...');
        await initPush(user.id);
      } else {
        logger.warn('NativeIntegration', 'No user logged in, initializing push without userId');
        await initPush();
      }

      logger.info('NativeIntegration', 'OneSignal initialized');
    } catch (error) {
      logger.error('NativeIntegration', 'Error initializing OneSignal:', error);
    }
  };

  // This component doesn't render anything - it's just for side effects
  return null;
};