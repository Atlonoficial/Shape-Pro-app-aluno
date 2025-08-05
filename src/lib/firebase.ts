import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Firebase configuration - ATENÇÃO: Substitua pelos valores reais do seu projeto Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q", // Substitua pelo seu API Key
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "shape-pro-app.firebaseapp.com", // Substitua pelo seu Auth Domain
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "shape-pro-app", // Substitua pelo seu Project ID
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "shape-pro-app.appspot.com", // Substitua pelo seu Storage Bucket
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012", // Substitua pelo seu Sender ID
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789012345678", // Substitua pelo seu App ID
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ" // Opcional - Google Analytics
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