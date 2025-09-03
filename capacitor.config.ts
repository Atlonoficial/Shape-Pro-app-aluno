import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d46ecb0f56a1441da5d5bac293c0288a',
  appName: 'Shape Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#000000',
  
  // Production configuration (remove server config for release)
  // server: {
  //   url: 'https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },

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
      appId: "1af0b3d5-8b2a-4c75-9e6f-3a4b5c6d7e8f",
      googleProjectNumber: "123456789012"
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