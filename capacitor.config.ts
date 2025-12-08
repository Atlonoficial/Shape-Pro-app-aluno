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
  version: "4.0.9", // ✅ BUILD 82: Dados de saúde expandidos
  ios: {
    scheme: "shapepro",
    contentInset: "automatic",
    backgroundColor: "#000000",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    // ✅ BUILD 82: Dados de saúde expandidos
    CFBundleVersion: '82',
    CFBundleShortVersionString: "4.0.9",
    // Tudo aqui vira Info.plist do app (garantido a cada build)
    plist: {
      // ---- Privacidade (evita ITMS-90683) ----
      NSPhotoLibraryUsageDescription:
        "Este app precisa acessar suas fotos para permitir que você adicione fotos de progresso e compartilhe conquistas.",
      NSPhotoLibraryAddUsageDescription:
        "Precisamos salvar imagens na sua galeria quando você exporta ou baixa mídias pelo app.",
      NSCameraUsageDescription:
        "Precisamos da câmera para tirar fotos dentro do app.",
      NSUserTrackingUsageDescription:
        "Este app usa dados de atividade para personalizar sua experiência de treino e fornecer conteúdo relevante.",
      // ---- Localização (ITMS-90683) ----
      NSLocationWhenInUseUsageDescription:
        "Usamos sua localização apenas para enviar notificações relevantes sobre treinos próximos a você.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Usamos sua localização apenas para enviar notificações relevantes sobre treinos próximos a você.",
      // Push em background (OneSignal)
      UIBackgroundModes: ["remote-notification"],
      // Criptografia
      ITSAppUsesNonExemptEncryption: false,
      // FASE 4: Block landscape on iPhone, allow on iPad for multitasking
      UISupportedInterfaceOrientations: [
        "UIInterfaceOrientationPortrait",
      ],
      "UISupportedInterfaceOrientations~ipad": [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationPortraitUpsideDown",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
      ],
      // Launch screen baseado em storyboard (exigido pelo iPad multitasking)
      UILaunchStoryboardName: "LaunchScreen",
      // *** Versões (garantem sincronização em todos os builds)
      CFBundleShortVersionString: "4.0.9",
      CFBundleVersion: "82", // ✅ BUILD 82
      // ---- OneSignal App ID ----
      OneSignal_app_id: "be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82",
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
    versionCode: 82, // ✅ BUILD 82
    versionName: "4.0.9"
  },

  plugins: {
    OneSignal: {
      appId: "be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82",
    },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0, // ✅ BUILD 24: 0ms = LoadingScreen assume imediatamente
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false, // ✅ Sem spinner nativo
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
    },
    Keyboard: { resize: "native", style: "dark", resizeOnFullScreen: true }, // ✅ BUILD 29: native evita resize do viewport
    StatusBar: { style: "dark", backgroundColor: "#000000" },
    Camera: { permissions: ["camera", "photos"] },
  },
};

export default config;
