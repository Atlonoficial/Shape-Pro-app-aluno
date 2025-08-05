/**
 * Service Worker para Firebase Cloud Messaging
 * 
 * CONEXÃO COM DASHBOARD DO PROFESSOR:
 * - Mesmas configurações Firebase do app principal
 * - Recebe push notifications enviadas pelo professor
 * - Exibe notificações quando app está em background
 */

// Import compat via importScripts
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Inicializa Firebase com mesma config do Dashboard do Professor
firebase.initializeApp({
  apiKey: "AIzaSyDM0AOhHD7AZRCjMn-SW1yvY860i8s5RJ8",
  authDomain: "shapepro-aluno.firebaseapp.com",
  projectId: "shapepro-aluno",
  storageBucket: "shapepro-aluno.firebasestorage.app",
  messagingSenderId: "200634869105",
  appId: "1:200634869105:web:7f0096b8457a5dd2f702d0"
});

// Handler para notificações em background enviadas pelo professor
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  console.log('🔔 [SW] Background message received:', payload);
  
  const { title, body, icon } = payload.notification || {};
  
  // Exibe notificação com dados do professor
  self.registration.showNotification(title || 'Shape Pro', {
    body: body || 'Nova mensagem do seu professor',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data,
    tag: 'shapepro-notification',
    requireInteraction: true
  });
});