const isDev = import.meta.env.DEV;
const isVerbose = import.meta.env.VITE_VERBOSE_LOGS === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isDev || isVerbose) console.log(...args);
  },
  error: (...args: any[]) => {
    // Em produção, apenas string simples (evitar objetos complexos)
    if (isDev) {
      console.error(...args);
    } else {
      // Apenas mensagem, sem stack trace pesada
      const message = typeof args[0] === 'string' ? args[0] : 'Erro';
      console.error(message);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDev || isVerbose) console.info(...args);
  }
};
