import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d46ecb0f56a1441da5d5bac293c0288a',
  appName: 'Shape Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',
  
  // PRODUÇÃO: Server config removido para build de produção
  // Para desenvolvimento local: descomente a linha abaixo
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
      // PRODUÇÃO: Configurar credenciais reais antes do build
      // 1. Acesse: https://app.onesignal.com e crie um novo app
      // 2. Configure Android: obter Server Key do Google Cloud Console 
      // 3. Configure iOS: upload do certificado .p12
      // 4. Substitua os valores abaixo pelos reais:
      appId: "YOUR_ONESIGNAL_APP_ID", // App ID do OneSignal Dashboard
      googleProjectNumber: "YOUR_GOOGLE_PROJECT_NUMBER" // Project Number do Google Cloud Console
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