import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Firebase configuration (mesmo que no app principal)
const firebaseConfig = {
  apiKey: "AIzaSyDM0AOhHD7AZRCjMn-SW1yvY860i8s5RJ8",
  authDomain: "shapepro-aluno.firebaseapp.com",
  projectId: "shapepro-aluno",
  storageBucket: "shapepro-aluno.firebasestorage.app",
  messagingSenderId: "200634869105",
  appId: "1:200634869105:web:7f0096b8457a5dd2f702d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase messaging for service worker
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Shape Pro';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.type || 'general',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  // Open app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});