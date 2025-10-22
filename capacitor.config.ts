// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

// Detecta produção/CI (Appflow exporta CI/Appflow vars)
const isCIOrProd =
  process.env.NODE_ENV === "production" ||
  process.env.CI === "true" ||
  process.env.APPFLOW_BUILD === "true";

// Em DEV você pode setar VITE_CAP_SERVER_URL para hot-reload;
// em produção/CI isso será sempre ignorado.
const serverUrlEnv = (process.env.VITE_CAP_SERVER_URL || "").trim();
const maybeServer =
  !isCIOrProd && serverUrlEnv
    ? { server: { url: serverUrlEnv, cleartext: true } }
    : {};

const config: CapacitorConfig = {
  appId: "com.atlontech.shapepro.aluno",
  appName: "Shape Pro",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#000000",

  // Em PROD/CI não terá server.url
  ...maybeServer,

  ios: {
    scheme: "ShapePro",
    contentInset: "automatic",
    backgroundColor: "#000000",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,

    // Tudo aqui vira Info.plist do app (garantido a cada build)
    plist: {
      // ---- Privacidade (evita ITMS-90683) ----
      NSPhotoLibraryUsageDescription:
        "Precisamos acessar suas fotos para você escolher imagens de perfil e anexar comprovantes no app.",
      NSPhotoLibraryAddUsageDescription:
        "Precisamos salvar imagens na sua galeria quando você exporta ou baixa mídias pelo app.",
      NSCameraUsageDescription:
        "Precisamos da câmera para tirar fotos dentro do app.",

      // *** Se o app OU SDKs referenciam localização, mantenha as duas abaixo.
      // *** Se não usa nada de localização, pode remover depois.
      NSLocationWhenInUseUsageDescription:
        "Usamos sua localização apenas enquanto o app está em uso para recursos relevantes.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Usamos sua localização somente quando necessário para recursos do app.",

      // Push em background (OneSignal)
      UIBackgroundModes: ["remote-notification"],

      // Criptografia
      ITSAppUsesNonExemptEncryption: false,

      // Orientações exigidas pelo iPad multitasking
      UISupportedInterfaceOrientations: [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
      ],
      "UISupportedInterfaceOrientations~ipad": [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationPortraitUpsideDown",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
      ],

      // Launch screen baseado em storyboard (exigido pelo iPad multitasking)
      UILaunchStoryboardName: "LaunchScreen",

      // *** Versões – se você preferir controlar aqui:
      // CFBundleShortVersionString: "2.0.1",
      // CFBundleVersion: "5",
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
      launchShowDuration: 0,
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
