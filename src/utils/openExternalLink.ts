import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Abre link externo de forma correta no Mobile (Browser nativo) ou Web (nova aba)
 */
export async function openExternalLink(url: string): Promise<void> {
  if (!url) {
    console.warn('[openExternalLink] URL inválida:', url);
    return;
  }

  console.log('[openExternalLink] 🔗 Abrindo link:', url);

  try {
    if (Capacitor.isNativePlatform()) {
      // Mobile: Abre no navegador nativo do dispositivo (Safari/Chrome)
      await Browser.open({ url });
      console.log('[openExternalLink] ✅ Link aberto no navegador nativo');
    } else {
      // Web: Abre em nova aba do navegador
      window.open(url, '_blank', 'noopener,noreferrer');
      console.log('[openExternalLink] ✅ Link aberto em nova aba');
    }
  } catch (error) {
    console.error('[openExternalLink] ❌ Erro ao abrir link:', error);
  }
}
