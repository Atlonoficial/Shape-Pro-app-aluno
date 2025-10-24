/**
 * Logger Otimizado para Produção - Build 26
 * Controla verbosidade de logs baseado no ambiente
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private enabled: boolean;
  
  constructor() {
    // Desabilitar logs completos em produção, exceto errors
    this.enabled = IS_DEV;
  }

  private formatMessage(level: LogLevel, context: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    
    return {
      timestamp,
      level,
      context,
      message: `${emoji} [${context}] ${message}`,
      data
    };
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      default: return '📝';
    }
  }

  info(context: string, message: string, data?: any) {
    if (!this.enabled) return;
    
    const formatted = this.formatMessage('info', context, message, data);
    console.info(formatted.message, data || '');
  }

  warn(context: string, message: string, data?: any) {
    // Warnings sempre aparecem
    const formatted = this.formatMessage('warn', context, message, data);
    console.warn(formatted.message, data || '');
  }

  error(context: string, message: string, error?: any) {
    // Errors sempre aparecem
    const formatted = this.formatMessage('error', context, message, error);
    console.error(formatted.message, error || '');
  }

  debug(context: string, message: string, data?: any) {
    if (!this.enabled) return;
    
    const formatted = this.formatMessage('debug', context, message, data);
    console.debug(formatted.message, data || '');
  }

  // Método especial para logs críticos que sempre aparecem
  critical(context: string, message: string, data?: any) {
    const formatted = this.formatMessage('error', context, `🚨 CRITICAL: ${message}`, data);
    console.error(formatted.message, data || '');
  }
}

export const logger = new Logger();
