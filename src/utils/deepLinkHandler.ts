import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/logger';

export async function initializeDeepLinkHandler() {
  if (!Capacitor.isNativePlatform()) {
    logger.log('[DeepLink] ⚠️ Not a native platform, skipping initialization');
    return;
  }

  logger.log('[DeepLink] 🚀 Initializing handler for native platform');

  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    logger.log('[DeepLink] 🔗 Received URL:', url);

    try {
      const urlObj = new URL(url);
      
      // shapepro://auth/confirm?token_hash=xxx&type=signup
      if (urlObj.pathname.includes('/auth/confirm')) {
        const params = urlObj.searchParams.toString();
        const targetUrl = `/auth/confirm?${params}`;
        
        logger.log('[DeepLink] ✅ Redirecting to:', targetUrl);
        window.location.href = targetUrl;
        return;
      }

      // shapepro://auth/recovery?token_hash=xxx&type=recovery
      if (urlObj.pathname.includes('/auth/recovery')) {
        const params = urlObj.searchParams.toString();
        const targetUrl = `/auth/recovery?${params}`;
        
        logger.log('[DeepLink] ✅ Redirecting to:', targetUrl);
        window.location.href = targetUrl;
        return;
      }

      logger.log('[DeepLink] ⚠️ Unhandled deep link:', url);

    } catch (error) {
      logger.error('[DeepLink] ❌ Error processing URL:', error);
    }
  });

  logger.log('[DeepLink] ✅ Handler initialized successfully');
}
