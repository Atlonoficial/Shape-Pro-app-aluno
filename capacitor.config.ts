// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.VITE_CAP_SERVER_URL || "").trim();

const config: CapacitorConfig = {
  appId: "com.atlontech.shapepro.aluno",
  appName: "Shape Pro",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#000000",

  // Em PRODUÇÃO deixe serverUrl vazio (só use em DEV/hot-reload)
  ...(serverUrl ? { server: { url: serverUrl, cleartext: true } } : {}),

  ios: {
    scheme: "ShapePro",
    contentInset: "automatic",
    backgroundColor: "#000000",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,

    // Vai para o Info.plist do app
    plist: {
      // ---- Privacidade (evita ITMS-90683) ----
      NSPhotoLibraryUsageDescription:
        "Precisamos acessar suas fotos para você escolher imagens de perfil e anexar comprovantes no app.",
      NSPhotoLibraryAddUsageDescription:
        "Precisamos salvar imagens na sua galeria quando você exporta ou baixa mídias pelo app.",
      NSCameraUsageDescription: "Precisamos da câmera para tirar fotos dentro do app.",
      
      // User Tracking (iOS 14.5+) - OBRIGATÓRIO para OneSignal/Analytics
      NSUserTrackingUsageDescription:
        "Usamos dados anônimos para melhorar sua experiência no app, personalizar notificações e enviar lembretes relevantes sobre seus treinos.",

      // OneSignal
      UIBackgroundModes: ["remote-notification"],

      // Criptografia (opcional, ajuda no compliance)
      ITSAppUsesNonExemptEncryption: false,

      // Força versão/build novos
      CFBundleShortVersionString: "4.0.0",
      CFBundleVersion: "42",
    },
  },

  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "Shape Pro/1.0",
    overrideUserAgent: "Shape Pro/1.0 Mobile App",
    hideLogs: true,
    cleartext: true,
    networkSecurityConfig: true,
  },

  plugins: {
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
    },
    Keyboard: { resize: "body", style: "dark", resizeOnFullScreen: true },
    StatusBar: { style: "dark", backgroundColor: "#000000" },
    Camera: { permissions: ["camera", "photos"] },
  },
};

export default config;
