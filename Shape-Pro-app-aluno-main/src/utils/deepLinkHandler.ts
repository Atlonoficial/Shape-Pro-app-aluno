import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export async function initializeDeepLinkHandler() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[DeepLink] ⚠️ Not a native platform, skipping initialization');
    return;
  }

  console.log('[DeepLink] 🚀 Initializing handler for native platform');

  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    console.log('[DeepLink] 🔗 Received URL:', url);

    try {
      const urlObj = new URL(url);
      
      // shapepro://auth/confirm?token_hash=xxx&type=signup
      if (urlObj.pathname.includes('/auth/confirm')) {
        const params = urlObj.searchParams.toString();
        const targetUrl = `/auth/confirm?${params}`;
        
        console.log('[DeepLink] ✅ Redirecting to:', targetUrl);
        window.location.href = targetUrl;
        return;
      }

      // shapepro://auth/recovery?token_hash=xxx&type=recovery
      if (urlObj.pathname.includes('/auth/recovery')) {
        const params = urlObj.searchParams.toString();
        const targetUrl = `/auth/recovery?${params}`;
        
        console.log('[DeepLink] ✅ Redirecting to:', targetUrl);
        window.location.href = targetUrl;
        return;
      }

      // shapepro://app/configuracoes (from Strava callback)
      if (urlObj.pathname.includes('/app/configuracoes')) {
        console.log('[DeepLink] ✅ Redirecting to settings after Strava');
        window.location.href = '/configuracoes';
        return;
      }

      console.log('[DeepLink] ⚠️ Unhandled deep link:', url);

    } catch (error) {
      console.error('[DeepLink] ❌ Error processing URL:', error);
    }
  });

  console.log('[DeepLink] ✅ Handler initialized successfully');
}
