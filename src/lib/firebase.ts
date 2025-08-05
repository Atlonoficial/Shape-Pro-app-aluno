import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Configuração real do projeto Shape Pro
const firebaseConfig = {
  apiKey: "AIzaSyDM0AOhHD7AZRCjMn-SW1yvY860i8s5RJ8",
  authDomain: "shapepro-aluno.firebaseapp.com",
  projectId: "shapepro-aluno",
  storageBucket: "shapepro-aluno.firebasestorage.app",
  messagingSenderId: "200634869105",
  appId: "1:200634869105:web:7f0096b8457a5dd2f702d0",
  measurementId: "G-PRPKV2TGG4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase messaging (only if supported)
export let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export default app;