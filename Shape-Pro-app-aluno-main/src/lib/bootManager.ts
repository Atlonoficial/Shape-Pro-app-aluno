/**
 * Boot Manager - Gerenciador de sincronização do boot da aplicação
 * Garante que todos os serviços estejam prontos antes do React renderizar
 */
class BootManager {
  private _bootComplete = false;
  private _bootStartTime = Date.now();
  
  /**
   * Marca o boot como completo
   */
  markBootComplete() {
    this._bootComplete = true;
    const bootTime = Date.now() - this._bootStartTime;
    console.log('[BootManager] ✅ Boot marked as complete', {
      bootTime: `${bootTime}ms`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Verifica se o boot está completo
   */
  isBootComplete() {
    return this._bootComplete;
  }
  
  /**
   * Aguarda o boot estar completo (com timeout)
   */
  async waitForBoot(timeoutMs = 10000) {
    if (this._bootComplete) {
      console.log('[BootManager] ✅ Boot already complete');
      return;
    }
    
    console.log('[BootManager] ⏳ Waiting for boot to complete...');
    const start = Date.now();
    
    while (!this._bootComplete && (Date.now() - start) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (!this._bootComplete) {
      const elapsed = Date.now() - start;
      console.error('[BootManager] ❌ Boot timeout after', elapsed, 'ms');
      throw new Error(`Boot timeout after ${elapsed}ms`);
    }
    
    console.log('[BootManager] ✅ Boot complete after', Date.now() - start, 'ms');
  }
  
  /**
   * Reset para testes (opcional)
   */
  reset() {
    this._bootComplete = false;
    this._bootStartTime = Date.now();
    console.log('[BootManager] 🔄 Reset');
  }
}

export const bootManager = new BootManager();
