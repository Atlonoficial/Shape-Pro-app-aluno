import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atlontech.shapepro.aluno',
  appName: 'Shape Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',
  server: {
    url: 'https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },

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
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
    },
    Camera: {
      permissions: ["camera", "photos"]
    }
  }
};

export default config;
