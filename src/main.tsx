import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from '@/utils/logger'

logger.log('[main.tsx] 🚀 App starting...');
logger.log('[main.tsx] Environment:', {
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  platform: (window as any).Capacitor?.getPlatform()
});

// Detectar quando DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
  logger.log('[main.tsx] ✅ DOM ready');
});

// Detectar quando Capacitor está pronto
if ((window as any).Capacitor) {
  document.addEventListener('deviceready', () => {
    logger.log('[main.tsx] ✅ Capacitor device ready');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

logger.log('[main.tsx] ✅ React render called');
