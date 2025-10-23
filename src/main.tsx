import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core';
import { initializeDeepLinkHandler } from '@/utils/deepLinkHandler';
import { createCapacitorStorage } from '@/lib/capacitorStorage';

console.log('[Boot] 🎯 CHECKPOINT 1: main.tsx loaded');

// Aguardar Capacitor estar completamente pronto
const waitForCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log('[Boot] 🔄 Waiting for Capacitor plugins...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ CRÍTICO: Inicializar storage ANTES de qualquer código React
    console.log('[Boot] 🔐 Initializing Capacitor storage...');
    try {
      await createCapacitorStorage();
      console.log('[Boot] ✅ Storage ready and tested');
    } catch (error) {
      console.error('[Boot] ❌ Storage initialization failed:', error);
      // Continuar mesmo com falha - web fallback
    }
    
    console.log('[Boot] 🎯 CHECKPOINT 2: Capacitor plugins ready');
  }
};

(async () => {
if (Capacitor.isNativePlatform()) {
  await waitForCapacitor();
  
  console.log('[Boot] 🚀 Starting native platform initialization...');
  console.log('[Boot] Platform:', Capacitor.getPlatform());
  
  // LOGGING APRIMORADO: Capturar TODOS os erros com detalhes completos
  window.addEventListener('error', (e) => {
    const errorDetails = {
      message: e?.error?.message || e?.message || 'Unknown error',
      stack: e?.error?.stack || 'No stack trace',
      filename: e.filename || 'Unknown file',
      lineno: e.lineno || 0,
      colno: e.colno || 0,
      timestamp: new Date().toISOString()
    };
    
    console.error('[Boot] ❌ CRITICAL ERROR:', JSON.stringify(errorDetails, null, 2));
  });
  
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const rejectionDetails = {
      reason: e?.reason?.message || e?.reason || 'Unknown rejection',
      stack: e?.reason?.stack || 'No stack trace',
      timestamp: new Date().toISOString()
    };
    
    console.error('[Boot] ❌ UNHANDLED PROMISE REJECTION:', JSON.stringify(rejectionDetails, null, 2));
  });

  // Inicializa deep links com segurança
  try {
    console.log('[Boot] 🔗 Initializing deep link handler...');
    initializeDeepLinkHandler();
    console.log('[Boot] ✅ Deep link handler initialized');
  } catch (err) {
    console.error('[Boot] ❌ DeepLink init failed:', err);
  }

  console.log('[Boot] ✅ Native initialization complete');
}
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
