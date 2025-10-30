import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core';
import { initializeDeepLinkHandler } from '@/utils/deepLinkHandler';
import { createCapacitorStorage } from '@/lib/capacitorStorage';
import { bootManager } from '@/lib/bootManager';

console.log('[Boot] 🔄 STEP 0: main.tsx loaded');

// ✅ NOVO: Health check para validar cada etapa do boot
const bootHealthCheck = {
  steps: [] as string[],
  addStep(step: string) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    this.steps.push(`${timestamp} - ${step}`);
    console.log(`[Boot Health] ✅ ${step}`);
  },
  getStatus() {
    return this.steps.join('\n');
  }
};

(window as any).__bootHealthCheck = bootHealthCheck; // ✅ Disponível no console
bootHealthCheck.addStep('STEP 0: main.tsx loaded');

// Aguardar Capacitor estar completamente pronto
const waitForCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    const isIOS = platform === 'ios';
    
    console.log('[Boot] 🔄 STEP 2: Native platform detected', {
      platform,
      isIOS,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });
    bootHealthCheck.addStep('STEP 2: Native platform detected');
    
    // ✅ Build 26: Tempos otimizados
    const waitTime = isIOS ? 300 : 150;
    console.log(`[Boot] ⏳ Waiting ${waitTime}ms for plugins...`);
    bootHealthCheck.addStep(`STEP 3: Waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    bootHealthCheck.addStep('STEP 3: Wait complete');
    
    // ✅ FASE 1: Inicializar storage PRIMEIRO
    console.log('[Boot] 🔐 STEP 3: Initializing Capacitor storage...', {
      timestamp: Date.now()
    });
    try {
      await createCapacitorStorage();
      console.log('[Boot] ✅ STEP 4: Storage ready and tested', {
        timestamp: Date.now()
      });
      bootHealthCheck.addStep('STEP 4: Storage initialized');
    } catch (error) {
      console.error('[Boot] ❌ CRITICAL: Storage init failed:', error);
      bootHealthCheck.addStep('STEP 4: Storage init FAILED');
      throw new Error(`Storage initialization failed: ${error}`);
    }
    
    // ✅ FASE 2: Forçar criação do Supabase client AGORA (não no import)
    console.log('[Boot] 🔐 STEP 5: Creating Supabase client...', {
      timestamp: Date.now()
    });
    
    const { getSupabase } = await import('@/integrations/supabase/client');
    const supabase = getSupabase(); // ✅ Força criação do client
    bootHealthCheck.addStep('STEP 5: Supabase client created');
    
    // ✅ BUILD 40.2 FASE 5: Wake up database com timeout maior
    console.log('[Boot] 🔄 STEP 6: Waking up database...', {
      timestamp: Date.now()
    });
    bootHealthCheck.addStep('STEP 6: Waking up database');
    
    try {
      const { checkDatabaseHealth } = await import('@/lib/supabase');
      
      // ✅ NOVO: Timeout maior durante boot (5s em vez de 3s)
      const healthCheckPromise = checkDatabaseHealth();
      const bootTimeoutPromise = new Promise<boolean>((resolve) => 
        setTimeout(() => {
          console.warn('[Boot] ⚠️ Health check timeout (5s), continuing anyway...');
          resolve(false);
        }, 5000)
      );
      
      const isHealthy = await Promise.race([healthCheckPromise, bootTimeoutPromise]);
      
      if (isHealthy) {
        console.log('[Boot] ✅ Database is awake and healthy');
        bootHealthCheck.addStep('STEP 6: Database awake');
      } else {
        console.warn('[Boot] ⚠️ Database slow to respond, but continuing boot');
        bootHealthCheck.addStep('STEP 6: Database slow (continuing anyway)');
      }
    } catch (error) {
      console.error('[Boot] ❌ Database health check failed:', error);
      bootHealthCheck.addStep('STEP 6: Database check failed (continuing anyway)');
      // ✅ NÃO bloquear boot
    }
    
    console.log('[Boot] 🔐 STEP 7: Loading Supabase session...', {
      timestamp: Date.now()
    });
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Boot] ❌ Session load error:', error);
      bootHealthCheck.addStep('STEP 7: Session load FAILED');
    } else {
      console.log('[Boot] ✅ STEP 8: Session loaded', {
        hasSession: !!data.session,
        userId: data.session?.user?.id || 'null',
        timestamp: Date.now()
      });
      bootHealthCheck.addStep('STEP 7: Session loaded');
    }
    
    console.log('[Boot] 🎯 STEP 8: Ready to render React', {
      timestamp: Date.now(),
      totalTime: `${Date.now() - performance.now()}ms`
    });
    bootHealthCheck.addStep('STEP 7: Ready to render');
  }
};

(async () => {
  try {
    console.debug('[Boot] 🔄 STEP 1: Starting boot sequence...');
    
    if (Capacitor.isNativePlatform()) {
      await waitForCapacitor();
      
      console.log('[Boot] 🚀 Starting native platform initialization...');
      console.debug('[Boot] Platform:', Capacitor.getPlatform());
      
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
      console.debug('[Boot] ℹ️ STEP 2: Web platform detected, skipping native init');
      console.debug('[Boot] 📝 Note: capacitorStorage will NOT be initialized (using localStorage)');
      console.debug('[Boot] 🔍 BUILD 28: Capacitor detection:', {
        isNativePlatform: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        CapacitorExists: typeof (window as any).Capacitor !== 'undefined'
      });
    }

    // ✅ BUILD 26: Marcar boot como completo (WEB + NATIVO)
    console.log('[Boot] 🎯 STEP 8: Marking boot as complete');
    bootManager.markBootComplete();
    bootHealthCheck.addStep('STEP 8: Boot marked complete');
    
    // ✅ BUILD 26: Aguardar 50ms para garantir propagação do flag
    console.log('[Boot] ⏳ STEP 8.5: Waiting 50ms for flag propagation...');
    await new Promise(resolve => setTimeout(resolve, 50));

    // ✅ BUILD 22: Renderizar React AGORA (garantia absoluta)
    console.log('[Boot] 🔄 STEP 9: Rendering React application...');
    
    const AppWrapper = Capacitor.isNativePlatform() ? (
      <App />
    ) : (
      <StrictMode>
        <App />
      </StrictMode>
    );

    createRoot(document.getElementById('root')!).render(AppWrapper);
    bootHealthCheck.addStep('STEP 9: React rendered');

    // ✅ Esconder loader nativo DEPOIS de React renderizar
    console.log('[Boot] 🔄 STEP 10: React rendered, hiding native loader...');
    setTimeout(() => {
      const nativeLoader = document.getElementById('native-loader');
      if (nativeLoader) {
        nativeLoader.classList.add('hidden');
        console.log('[Boot] ✅ STEP 11: Native loader hidden');
        setTimeout(() => {
          nativeLoader.remove();
          console.log('[Boot] ✅ STEP 12: Native loader removed from DOM');
        }, 500);
      }
    }, 100);
    
  } catch (error) {
    // ✅ BUILD 21: SEMPRE esconder loader mesmo com erro
    console.error('[Boot] ❌ FATAL ERROR:', error);
    
    const loader = document.getElementById('native-loader');
    if (loader) loader.remove();
    
    // ✅ Mostrar tela de erro ao invés de tela preta
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="min-height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div style="text-align: center; max-width: 400px;">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h1 style="color: white; font-size: 24px; margin-bottom: 10px; font-family: system-ui;">Erro ao Iniciar</h1>
            <p style="color: #9ca3af; margin-bottom: 20px; font-family: system-ui;">Não foi possível inicializar o aplicativo.</p>
            <button 
              onclick="window.location.reload()" 
              style="background: #eab308; color: black; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-family: system-ui;"
            >
              🔄 Tentar Novamente
            </button>
            <details style="margin-top: 20px; text-align: left; color: #6b7280; font-size: 12px; font-family: monospace;">
              <summary style="cursor: pointer; font-family: system-ui;">Detalhes técnicos</summary>
              <pre style="margin-top: 10px; padding: 10px; background: #1f2937; border-radius: 4px; overflow: auto; white-space: pre-wrap; word-break: break-word;">${error}</pre>
            </details>
          </div>
        </div>
      `;
    }
  }
})();
