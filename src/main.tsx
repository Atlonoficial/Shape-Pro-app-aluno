import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core';
import { initializeDeepLinkHandler } from '@/utils/deepLinkHandler';
import { createCapacitorStorage } from '@/lib/capacitorStorage';

console.log('[Boot] 🔄 STEP 0: main.tsx loaded');

// Aguardar Capacitor estar completamente pronto
const waitForCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log('[Boot] 🔄 STEP 2: Native platform detected, initializing Capacitor plugins...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ FASE 1 CRÍTICO: Inicializar storage ANTES de qualquer código React
    console.log('[Boot] 🔐 STEP 3: Initializing Capacitor storage...');
    try {
      await createCapacitorStorage();
      console.log('[Boot] ✅ STEP 4: Storage ready and tested');
    } catch (error) {
      console.error('[Boot] ❌ Storage initialization failed:', error);
      // Continuar mesmo com falha - web fallback
    }
    
    console.log('[Boot] 🎯 STEP 5: Capacitor plugins ready, proceeding to React render');
  }
};

(async () => {
console.log('[Boot] 🔄 STEP 1: Starting boot sequence...');
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
} else {
  console.log('[Boot] ℹ️ STEP 2: Web platform detected, skipping native init');
}

console.log('[Boot] 🔄 STEP 6: Rendering React application...');
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ✅ FASE 3: Esconder loader nativo DEPOIS de React renderizar
console.log('[Boot] 🔄 STEP 7: React rendered, hiding native loader...');
setTimeout(() => {
  const nativeLoader = document.getElementById('native-loader');
  if (nativeLoader) {
    nativeLoader.classList.add('hidden');
    console.log('[Boot] ✅ STEP 8: Native loader hidden');
    setTimeout(() => {
      nativeLoader.remove();
      console.log('[Boot] ✅ STEP 9: Native loader removed from DOM');
    }, 500);
  }
}, 100);
