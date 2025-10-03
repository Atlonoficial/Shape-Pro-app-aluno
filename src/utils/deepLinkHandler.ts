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
      
      // shapepro://app/auth/confirm?token_hash=xxx&type=signup
      if (urlObj.host === 'app' && urlObj.pathname.includes('/auth/confirm')) {
        const params = urlObj.searchParams.toString();
        const targetUrl = `/app/auth/confirm?${params}`;
        
        console.log('[DeepLink] ✅ Redirecting to:', targetUrl);
        window.location.href = targetUrl;
        return;
      }

      // shapepro://app/auth/reset-password?token_hash=xxx&type=recovery
      if (urlObj.host === 'app' && urlObj.pathname.includes('/auth/reset-password')) {
        const params = urlObj.searchParams.toString();
        const targetUrl = `/app/auth/reset-password?${params}`;
        
        console.log('[DeepLink] ✅ Redirecting to:', targetUrl);
        window.location.href = targetUrl;
        return;
      }

      console.log('[DeepLink] ⚠️ Unhandled deep link:', url);

    } catch (error) {
      console.error('[DeepLink] ❌ Error processing URL:', error);
    }
  });

  console.log('[DeepLink] ✅ Handler initialized successfully');
}
