import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core';
import { initializeDeepLinkHandler } from '@/utils/deepLinkHandler';

// Initialize deep links for native platforms
if (Capacitor.isNativePlatform()) {
  console.log('[main] 🔗 Initializing deep link handler...');
  initializeDeepLinkHandler();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
