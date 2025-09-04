import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d46ecb0f56a1441da5d5bac293c0288a',
  appName: 'Shape Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',
  
  // PRODUÇÃO: Configuração limpa para builds de produção
  // Server config removido - apenas para builds finais

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
      // ⚠️ OBRIGATÓRIO: Configure antes do build de produção
      // 1. Criar app em: https://app.onesignal.com 
      // 2. Android: Google Cloud Console → FCM Server Key
      // 3. iOS: Apple Developer → Push Certificate (.p12)
      // 4. Substitua pelos valores reais:
      appId: "CONFIGURE_SEU_ONESIGNAL_APP_ID_AQUI",
      googleProjectNumber: "CONFIGURE_SEU_GOOGLE_PROJECT_NUMBER_AQUI"
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