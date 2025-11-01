type LogLevel = 'log' | 'warn' | 'error' | 'info';

const isDev = import.meta.env.DEV;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[ShapePro] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`[ShapePro] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    // Always log errors, even in production
    console.error(`[ShapePro] ${message}`, ...args);
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[ShapePro] ${message}`, ...args);
    }
  },
};
