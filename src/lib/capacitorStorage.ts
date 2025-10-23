import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * CRÍTICO: Supabase Auth requer storage SÍNCRONO
 * Capacitor Preferences é assíncrono, então:
 * 1. Carregamos TUDO na inicialização
 * 2. Operações síncronas usam cache em memória
 * 3. Persistência acontece em background
 */
class CapacitorStorageAdapter {
  private cache: Map<string, string> = new Map();
  public initialized = false; // ✅ PÚBLICO para verificação externa
  private initPromise: Promise<void> | null = null;

  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      try {
        console.log('[CapacitorStorage] 🔄 STEP 1A: Starting initialization...');
        console.log('[CapacitorStorage] 🔄 STEP 1B: Platform:', Capacitor.getPlatform());
        console.log('[CapacitorStorage] 🔄 STEP 1C: Calling Preferences.keys()...');
        
        // Carregar TODAS as chaves do Supabase do storage nativo
        const { keys } = await Preferences.keys();
        console.log('[CapacitorStorage] 🔄 STEP 1D: Total keys found:', keys.length);
        
        const supabaseKeys = keys.filter(k => 
          k.startsWith('sb-') || k.includes('supabase')
        );

        console.log('[CapacitorStorage] 📦 STEP 1E: Found', supabaseKeys.length, 'Supabase keys');

        for (const key of supabaseKeys) {
          const { value } = await Preferences.get({ key });
          if (value) {
            this.cache.set(key, value);
            console.log('[CapacitorStorage] ✅ Loaded:', key.substring(0, 30) + '...');
          }
        }

        this.initialized = true;
        console.log('[CapacitorStorage] ✅ STEP 2: Initialization complete with', this.cache.size, 'cached keys');
      } catch (error) {
        console.error('[CapacitorStorage] ❌ Init failed:', error);
        throw error;
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
