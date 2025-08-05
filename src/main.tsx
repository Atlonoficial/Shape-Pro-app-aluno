import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { messaging } from '@/lib/firebase'

/**
 * REGISTRO DO SERVICE WORKER PARA FCM
 * 
 * CONEXÃO COM DASHBOARD DO PROFESSOR:
 * - Registra SW para receber notificações em background
 * - Professor envia push notifications → aluno recebe aqui
 * - Sincronizado com mesma instância Firebase
 */

// Registrar Service Worker para Firebase Messaging
if ('serviceWorker' in navigator && messaging) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('🔔 [App] SW registered successfully:', registration);
      
      // Conectar messaging ao service worker registrado
      if (messaging && 'useServiceWorker' in messaging) {
        messaging.useServiceWorker(registration);
      }
    })
    .catch((error) => {
      console.error('🔔 [App] SW registration failed:', error);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
