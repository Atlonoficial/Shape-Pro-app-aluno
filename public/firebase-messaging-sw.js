import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Firebase configuration (mesmo que no app principal)
const firebaseConfig = {
  apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q", // Substitua pelo seu API Key
  authDomain: "shape-pro-app.firebaseapp.com", // Substitua pelo seu Auth Domain
  projectId: "shape-pro-app", // Substitua pelo seu Project ID
  storageBucket: "shape-pro-app.appspot.com", // Substitua pelo seu Storage Bucket
  messagingSenderId: "123456789012", // Substitua pelo seu Sender ID
  appId: "1:123456789012:web:abcdef123456789012345678" // Substitua pelo seu App ID
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