import { logger } from '@/lib/logger';

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
    logger.info('BootManager', '✅ Boot marked as complete', {
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
      logger.info('BootManager', '✅ Boot already complete');
      return;
    }
    
    logger.info('BootManager', '⏳ Waiting for boot to complete...');
    const start = Date.now();
    
    while (!this._bootComplete && (Date.now() - start) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (!this._bootComplete) {
      const elapsed = Date.now() - start;
      logger.error('BootManager', `❌ Boot timeout after ${elapsed}ms`);
      throw new Error(`Boot timeout after ${elapsed}ms`);
    }
    
    const elapsed = Date.now() - start;
    logger.info('BootManager', `✅ Boot complete after ${elapsed}ms`);
  }
  
  /**
   * Reset para testes (opcional)
   */
  reset() {
    this._bootComplete = false;
    this._bootStartTime = Date.now();
    logger.info('BootManager', '🔄 Reset');
  }
}

export const bootManager = new BootManager();
