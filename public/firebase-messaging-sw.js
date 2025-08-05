// Import compat via importScripts
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Inicializa Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDM0AOhHD7AZRCjMn-SW1yvY860i8s5RJ8",
  authDomain: "shapepro-aluno.firebaseapp.com",
  projectId: "shapepro-aluno",
  storageBucket: "shapepro-aluno.firebasestorage.app",
  messagingSenderId: "200634869105",
  appId: "1:200634869105:web:7f0096b8457a5dd2f702d0"
});

// Registra o handler de notificações em background
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title, { body, icon, data: payload.data });
});