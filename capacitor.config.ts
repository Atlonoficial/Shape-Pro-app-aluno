import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d46ecb0f56a1441da5d5bac293c0288a',
  appName: 'shape-pro',
  webDir: 'dist',
  server: {
    url: 'https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    FirebaseApp: {
      presentationMode: 'fullscreen',
      loggingEnabled: true
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'apple.com']
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;