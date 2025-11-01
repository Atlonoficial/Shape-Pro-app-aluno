const isDev = import.meta.env.DEV;
const isVerbose = import.meta.env.VITE_VERBOSE_LOGS === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isDev || isVerbose) console.log(...args);
  },
  error: (...args: any[]) => {
    // Mostrar erros sempre, mas só detalhes em dev
    if (isDev) {
      console.error(...args);
    } else {
      console.error(args[0]); // Apenas mensagem principal em produção
    }
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDev || isVerbose) console.info(...args);
  }
};
