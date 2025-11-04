import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';

/**
 * CRÍTICO: Supabase Auth requer storage SÍNCRONO
 * Capacitor Preferences é assíncrono, então:
 * 1. Carregamos TUDO na inicialização
 * 2. Operações síncronas usam cache em memória
 * 3. Persistência acontece em background
 */

// ✅ BUILD 48: Wrapper com timeout para operações do Preferences
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
      logger.info('CapacitorStorage', 'Already initialized');
      return;
    }
    
    if (this.initPromise) {
      logger.info('CapacitorStorage', 'Init in progress, waiting');
      return this.initPromise;
    }
    
    this.initPromise = (async () => {
      const startTime = Date.now();
      let attempt = 0;
      const maxAttempts = 2; // ✅ BUILD 48: Tentar 2 vezes
      
      while (attempt < maxAttempts) {
        attempt++;
        
        try {
          logger.info('CapacitorStorage', `Init attempt ${attempt}/${maxAttempts}`, {
            platform: Capacitor.getPlatform(),
            timestamp: Date.now()
          });
          
          // ✅ Testar se Preferences está disponível
          if (!Preferences || typeof Preferences.keys !== 'function') {
            throw new Error('Preferences plugin not available');
          }
          
          logger.info('CapacitorStorage', 'Calling Preferences.keys() with 8s timeout...');
          
          // ✅ BUILD 49: Timeout aumentado (5s → 8s para iOS real)
          const { keys } = await withTimeout(
            Preferences.keys(),
            8000, // 5s → 8s
            'Preferences.keys()'
          );
          logger.info('CapacitorStorage', `Total keys found: ${keys.length}`);
          
          const supabaseKeys = keys.filter(k => 
            k.startsWith('sb-') || k.includes('supabase')
          );

          logger.info('CapacitorStorage', `Found ${supabaseKeys.length} Supabase keys`);

          // ✅ Teste de escrita/leitura
          const testKey = 'sb-test-init-' + Date.now();
          const testValue = 'test-' + Math.random();
          logger.info('CapacitorStorage', 'Testing write/read permissions...');
          
          await Preferences.set({ key: testKey, value: testValue });
          const testRead = await Preferences.get({ key: testKey });
          
          if (testRead.value !== testValue) {
            throw new Error('Storage write/read test failed');
          }
          
          await Preferences.remove({ key: testKey });
          logger.info('CapacitorStorage', 'Write/read test passed');

          for (const key of supabaseKeys) {
            const { value } = await Preferences.get({ key });
            if (value) {
              this.cache.set(key, value);
            }
          }

          this.initialized = true;
          logger.info('CapacitorStorage', 'Init complete', {
            cachedKeys: this.cache.size,
            duration: `${Date.now() - startTime}ms`,
            attempt
          });
          return;
          
        } catch (error) {
          logger.error('CapacitorStorage', `Init attempt ${attempt} failed:`, error);
          
          if (attempt >= maxAttempts) {
            logger.error('CapacitorStorage', 'Max attempts reached, throwing error for localStorage fallback');
            // ✅ BUILD 49: NÃO forçar initialized, jogar erro para forçar fallback
            throw new Error('Capacitor Storage initialization failed after 2 attempts');
          }
          
          // ✅ Aguardar 500ms antes de retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    })();

    return this.initPromise;
  }

  // ✅ SÍNCRONO - Supabase consegue ler
  getItem(key: string): string | null {
    const value = this.cache.get(key) || null;
    
    if (!this.initialized && !this.initPromise) {
      logger.warn('CapacitorStorage', 'getItem called before init started', { key });
    }
    
    return value;
  }

  // ✅ SÍNCRONO - Supabase consegue escrever
  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    
    // Persistir de forma assíncrona
    Preferences.set({ key, value }).catch(err => 
      logger.error('CapacitorStorage', 'Persist failed', { key, error: err })
    );
  }

  // ✅ SÍNCRONO - Supabase consegue deletar
  removeItem(key: string): void {
    this.cache.delete(key);
    
    Preferences.remove({ key }).catch(err =>
      logger.error('CapacitorStorage', 'Remove failed', { key, error: err })
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
      logger.info('CapacitorStorage', `Test: ${success ? 'PASS' : 'FAIL'}`);
      return success;
    } catch (error) {
      logger.error('CapacitorStorage', 'Test error:', error);
      return false;
    }
  }
}

// Singleton global
export const capacitorStorage = new CapacitorStorageAdapter();

export const createCapacitorStorage = async () => {
  if (!Capacitor.isNativePlatform()) {
    logger.info('CapacitorStorage', 'Using localStorage (web)');
    return localStorage;
  }

  await capacitorStorage.initialize();
  capacitorStorage.test();
  return capacitorStorage;
};
