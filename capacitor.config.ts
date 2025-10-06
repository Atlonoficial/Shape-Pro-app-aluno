// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

// Se quiser usar o servidor remoto (apenas DEV), defina esta variável no ambiente:
// VITE_CAP_SERVER_URL=https://SEU_ID.lovableproject.com?forceHideBadge=true
const serverUrl = (process.env.VITE_CAP_SERVER_URL || '').trim();

const config: CapacitorConfig = {
  appId: 'com.atlontech.shapepro.aluno',
  appName: 'Shape Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',

  // 🔒 Em produção, NÃO defina VITE_CAP_SERVER_URL.
  // Se estiver definida, incluímos o server.url (apenas para DEV/hot-reload).
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: true,
        },
      }
    : {}),

  ios: {
    scheme: 'ShapePro',
    contentInset: 'automatic',
    backgroundColor: '#000000',
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
  },

  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'Shape Pro/1.0',
    overrideUserAgent: 'Shape Pro/1.0 Mobile App',
    hideLogs: true,
    cleartext: true,
    networkSecurityConfig: true,
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0000,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
    Camera: {
      permissions: ['camera', 'photos'],
    },
  },
};

export default config;
