import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

/**
 * Firebase configuration compartilhada entre App do Aluno e Dashboard do Professor
 * 
 * CONEXÃO COM DASHBOARD:
 * - Mesmo projectId: "shapepro-aluno" 
 * - Mesmas collections: students, training_plans, messages, fcm_tokens
 * - Professor cadastra alunos → aparecem em real-time no app
 * - Professor cria treinos → aluno recebe via onSnapshot
 * - Chat bidirecional entre professor e aluno
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDM0AOhHD7AZRCjMn-SW1yvY860i8s5RJ8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shapepro-aluno.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shapepro-aluno",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shapepro-aluno.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "200634869105",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:200634869105:web:7f0096b8457a5dd2f702d0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PRPKV2TGG4"
};

// Initialize Firebase - mesma instância usada pelo Dashboard do Professor
const app = initializeApp(firebaseConfig);

/**
 * Serviços Firebase compartilhados
 * 
 * SINCRONIZAÇÃO COM DASHBOARD:
 * - auth: autentica alunos no mesmo projeto do professor
 * - db: acessa mesmas collections (students, training_plans, messages)
 * - storage: compartilha arquivos de exercícios e avatars
 * - messaging: recebe push notifications do professor
 */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase messaging (only if supported)
export let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
    console.log('🔔 [App] Firebase Messaging initialized');
  } else {
    console.warn('🔔 [App] Firebase Messaging not supported');
  }
});

export default app;