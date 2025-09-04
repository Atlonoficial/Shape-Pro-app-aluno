import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d46ecb0f56a1441da5d5bac293c0288a',
  appName: 'Shape Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',
  
  // PRODUÇÃO: Remover server config para build de produção
  // Durante desenvolvimento, pode descomentar a linha abaixo:
  // server: { url: 'https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com?forceHideBadge=true', cleartext: true }

  ios: {
    scheme: 'Shape Pro',
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
    appendUserAgent: 'ShapePro/1.0',
    overrideUserAgent: 'ShapePro/1.0 Mobile App',
    hideLogs: true,
  },

  plugins: {
    OneSignal: {
      // PRODUÇÃO: Substituir pelas credenciais reais do OneSignal
      // 1. Criar app no dashboard OneSignal (https://app.onesignal.com)
      // 2. Obter App ID do OneSignal
      // 3. Obter Google Project Number do Google Cloud Console (não Firebase)
      appId: "ONESIGNAL_APP_ID_AQUI", // Substituir pelo App ID real do OneSignal
      googleProjectNumber: "GOOGLE_PROJECT_NUMBER_AQUI" // Substituir pelo Project Number do Google Cloud
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
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
    },
    Storage: {
      group: "ShapeProGroup"
    }
  }
};

export default config;