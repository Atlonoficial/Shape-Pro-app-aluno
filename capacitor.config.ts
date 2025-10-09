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
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: true,
        },
      }
    : {}),

  ios: {
    scheme: "ShapePro",
    contentInset: "automatic",
    backgroundColor: "#000000",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,

    // 🔑 Entradas que vão para o Info.plist do App (obrigatórias p/ Apple)
    plist: {
      // ---- Privacidade (evita ITMS-90683) ----
      NSPhotoLibraryUsageDescription:
        "Precisamos acessar suas fotos para você escolher imagens de perfil e anexar comprovantes no app.",
      NSPhotoLibraryAddUsageDescription:
        "Precisamos salvar imagens na sua galeria quando você exporta ou baixa mídias pelo app.",
      NSCameraUsageDescription: "Precisamos da câmera para tirar fotos dentro do app.",
      NSLocationWhenInUseUsageDescription:
        "Usamos sua localização apenas enquanto o app está em uso para enviar notificações relevantes na sua região.",
      // Extra para silenciar scanners de localização
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Usamos sua localização somente quando necessário para recursos do app.",

      // ---- Requisito do OneSignal (aviso que apareceu no build) ----
      UIBackgroundModes: ["remote-notification"],

      // ---- Forçar nova versão/build para o App Store Connect enxergar que é binário novo ----
      CFBundleShortVersionString: "1.1.1", // versão de marketing (mude se quiser)
      CFBundleVersion: "2", // número do build (sempre incremente)
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
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER",
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
      permissions: ["camera", "photos"],
    },
  },
};

export default config;
