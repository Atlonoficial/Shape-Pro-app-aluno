import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core';
import { initializeDeepLinkHandler } from '@/utils/deepLinkHandler';

if (Capacitor.isNativePlatform()) {
  // Logs de falhas globais — aparecem no Device Log/TestFlight (e ajudam a sair da “tela preta”)
  window.addEventListener('error', (e) => {
    console.error('[boot] window.onerror:', e?.error || e?.message || e);
  });
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    console.error('[boot] unhandledrejection:', e?.reason);
  });

  // Inicializa deep links com segurança
  try {
    console.log('[main] 🔗 Initializing deep link handler...');
    initializeDeepLinkHandler();
  } catch (err) {
    console.error('[main] deepLink init failed:', err);
  }

  // Garante esconder o splash cedo (além do autoHide do plugin)
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => SplashScreen.hide())
    .catch(() => {/* ignore */});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
