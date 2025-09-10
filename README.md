# Shape Pro - Personal Training App 🏋️‍♂️

> **Aplicativo completo de personal training com React + TypeScript + Supabase**

## 🎯 **STATUS: PRONTO PARA PRODUÇÃO**

### ✅ **Stack Técnico:**
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase 
- **Mobile:** Capacitor 7+ (iOS + Android)
- **Notificações:** OneSignal

## 🚀 **Comandos Essenciais:**

### **Desenvolvimento:**
```bash
npm install
npm run dev
```

### **Build e Deploy:**
```bash
npm run build
npx cap sync android
npx cap sync ios
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

## 📱 **Configuração Mobile:**

### **Primeiro Setup:**
```bash
# Após exportar projeto do Lovable
npm install
npx cap add android
npx cap add ios
npx cap sync
```

### **Builds de Produção:**
- **Android:** Seguir `scripts/android-release-build.md`
- **iOS:** Seguir `scripts/ios-release-build.md`

---

**Shape Pro - Ready for Android Studio & Xcode**