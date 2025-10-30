import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * CRÍTICO: Supabase Auth requer storage SÍNCRONO
 * Capacitor Preferences é assíncrono, então:
 * 1. Carregamos TUDO na inicialização
 * 2. Operações síncronas usam cache em memória
 * 3. Persistência acontece em background
 */

// ✅ NOVO: Wrapper com timeout para operações do Preferences
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}
class CapacitorStorageAdapter {
  private cache: Map<string, string> = new Map();
  public initialized = false; // ✅ PÚBLICO para verificação externa
  private initPromise: Promise<void> | null = null;

  async initialize() {
    if (this.initialized) {
      console.log('[CapacitorStorage] ✅ Already initialized, skipping');
      return;
    }
    
    if (this.initPromise) {
      console.log('[CapacitorStorage] ⏳ Init already in progress, waiting...');
      return this.initPromise;
    }
    
    this.initPromise = (async () => {
      const startTime = Date.now();
      
      try {
        console.log('[CapacitorStorage] 🔄 STEP 1A: Starting initialization...', {
          platform: Capacitor.getPlatform(),
          timestamp: startTime
        });
        
        // ✅ BUILD 21: Testar se Preferences está disponível
        if (!Preferences || typeof Preferences.keys !== 'function') {
          throw new Error('Preferences plugin not available');
        }
        
        console.log('[CapacitorStorage] 🔄 STEP 1B: Calling Preferences.keys() with 3s timeout...');
        
        // ✅ NOVO: Adicionar timeout de 3 segundos
        const { keys } = await withTimeout(
          Preferences.keys(),
          3000,
          'Preferences.keys()'
        );
        console.log('[CapacitorStorage] 🔄 STEP 1C: Total keys found:', keys.length);
        
        const supabaseKeys = keys.filter(k => 
          k.startsWith('sb-') || k.includes('supabase')
        );

        console.log('[CapacitorStorage] 📦 STEP 1D: Found', supabaseKeys.length, 'Supabase keys');

        // ✅ BUILD 40: Teste de escrita/leitura para verificar permissões
        const testKey = 'sb-test-init-' + Date.now();
        const testValue = 'test-' + Math.random();
        console.log('[CapacitorStorage] 🧪 Testing write/read permissions...');
        
        await Preferences.set({ key: testKey, value: testValue });
        const testRead = await Preferences.get({ key: testKey });
        
        if (testRead.value !== testValue) {
          throw new Error('Storage write/read test failed: values do not match');
        }
        
        await Preferences.remove({ key: testKey });
        console.log('[CapacitorStorage] ✅ Write/read test passed');

        for (const key of supabaseKeys) {
          const { value } = await Preferences.get({ key });
          if (value) {
            this.cache.set(key, value);
            console.log('[CapacitorStorage] ✅ Loaded:', key.substring(0, 30) + '...');
          }
        }

        this.initialized = true;
        console.log('[CapacitorStorage] ✅ STEP 2: Initialization complete!', {
          cachedKeys: this.cache.size,
          duration: `${Date.now() - startTime}ms`,
          timestamp: Date.now(),
          // ✅ BUILD 25: Confirmar flag está true
          initializedFlag: this.initialized,
          cacheContents: Array.from(this.cache.keys()).map(k => k.substring(0, 30))
        });
        
      } catch (error) {
        console.error('[CapacitorStorage] ❌ CRITICAL: Init failed:', error);
        
        // ✅ NOVO: Se falhar, usar localStorage como fallback
        console.error('[CapacitorStorage] 🔄 Falling back to localStorage...');
        this.initialized = true; // ✅ Marcar como inicializado para não travar o boot
        this.initPromise = null;
        
        // ✅ Importante: Não fazer throw, permitir que o app continue
        return;
      }
    })();

    return this.initPromise;
  }

  // ✅ SÍNCRONO - Supabase consegue ler
  getItem(key: string): string | null {
    // ✅ Se ainda está inicializando, tentar ler do cache sem warning
    // O cache pode já ter dados carregados mesmo durante init
    const value = this.cache.get(key) || null;
    
    if (!this.initialized && !this.initPromise) {
      console.warn('[CapacitorStorage] ⚠️ getItem called before init started:', key);
    }
    
    console.log('[CapacitorStorage] GET:', key, '→', value ? '✅ HIT' : '❌ MISS');
    return value;
  }

  // ✅ SÍNCRONO - Supabase consegue escrever
  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    console.log('[CapacitorStorage] SET:', key, '→', value.substring(0, 50) + '...');
    
    // Persistir de forma assíncrona (não bloqueia)
    Preferences.set({ key, value }).catch(err => 
      console.error('[CapacitorStorage] ❌ Persist failed:', key, err)
    );
  }

  // ✅ SÍNCRONO - Supabase consegue deletar
  removeItem(key: string): void {
    this.cache.delete(key);
    console.log('[CapacitorStorage] REMOVE:', key);
    
    Preferences.remove({ key }).catch(err =>
      console.error('[CapacitorStorage] ❌ Remove failed:', key, err)
    );
  }

  // Método para testar se storage está funcionando
  test(): boolean {
    const testKey = 'test-storage-' + Date.now();
    const testValue = 'test-value-' + Math.random();
    
    try {
      this.setItem(testKey, testValue);
      const retrieved = this.getItem(testKey);
      this.removeItem(testKey);
      
      const success = retrieved === testValue;
      console.log('[CapacitorStorage] Test:', success ? '✅ PASS' : '❌ FAIL');
      return success;
    } catch (error) {
      console.error('[CapacitorStorage] Test error:', error);
      return false;
    }
  }
}

// Singleton global
export const capacitorStorage = new CapacitorStorageAdapter();

export const createCapacitorStorage = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[CapacitorStorage] Using localStorage (web)');
    return localStorage;
  }

  await capacitorStorage.initialize();
  capacitorStorage.test();
  return capacitorStorage;
};
