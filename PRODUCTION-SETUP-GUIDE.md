# 🚀 GUIA DE CONFIGURAÇÃO PARA PRODUÇÃO - SHAPE PRO

## 📱 CONFIGURAÇÃO FINAL PARA AS LOJAS OFICIAIS

### ✅ CONFIGURAÇÃO ATUAL
- ✅ Firebase REMOVIDO completamente
- ✅ Supabase configurado e funcionando  
- ✅ OneSignal para notificações push
- ✅ Capacitor configurado para produção

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### 1. 📳 OneSignal - Notificações Push
**Passos obrigatórios antes da publicação:**

1. **Criar App no OneSignal:**
   - Acesse: https://app.onesignal.com
   - Criar novo app → Selecionar Android/iOS
   - Obter o **App ID** gerado

2. **Google Cloud Console (para FCM):**
   - Acesse: https://console.cloud.google.com
   - Criar novo projeto (ou usar existente)
   - Ativar **Firebase Cloud Messaging API**
   - Obter o **Project Number** (não confundir com Project ID)

3. **Atualizar capacitor.config.ts:**
   ```typescript
   OneSignal: {
     appId: "SEU_ONESIGNAL_APP_ID_AQUI",
     googleProjectNumber: "SEU_GOOGLE_PROJECT_NUMBER_AQUI"
   }
   ```

---

## 📦 PREPARAÇÃO PARA ANDROID (Google Play)

### 1. **Versioning (android/app/build.gradle):**
```gradle
android {
    defaultConfig {
        versionCode 1        // Incrementar a cada release
        versionName "1.0.0"  // Formato semântico
    }
}
```

### 2. **Keystore para Assinatura:**
```bash
# Gerar keystore (GUARDAR EM LOCAL SEGURO!)
keytool -genkey -v -keystore shapepro-release-key.keystore -name shapepro_key -keyalg RSA -keysize 2048 -validity 25000

# Informações necessárias:
- Nome: Shape Pro
- Organização: Sua Empresa
- Cidade: Sua Cidade  
- Estado: Seu Estado
- País: BR
- Senha: (ANOTAR E GUARDAR COM SEGURANÇA!)
```

### 3. **Build de Produção:**
```bash
npm run build
npx cap sync android
# Abrir Android Studio
# Build → Generate Signed Bundle / APK
# Selecionar Android App Bundle (AAB)
# Configurar keystore criado acima
```

---

## 🍎 PREPARAÇÃO PARA iOS (App Store)

### 1. **Configurações no Xcode:**
- Abrir `ios/App/App.xcworkspace`
- Configurar Bundle Identifier único
- Configurar Team e Provisioning Profile
- Atualizar versão no `Info.plist`

### 2. **Build de Produção:**
```bash
npm run build  
npx cap sync ios
# Abrir Xcode
# Product → Archive
# Distribute App → App Store Connect
```

---

## 📋 CHECKLIST FINAL

### ✅ Antes da Publicação:
- [ ] OneSignal App ID configurado
- [ ] Google Project Number configurado  
- [ ] Testado notificações push em dispositivo físico
- [ ] Todas as funcionalidades testadas
- [ ] Versioning correto (Android e iOS)
- [ ] Ícones e splash screens finalizados
- [ ] Políticas de privacidade prontas
- [ ] Screenshots das lojas preparadas

### ✅ Android:
- [ ] Keystore gerado e seguro
- [ ] AAB gerado e testado
- [ ] Google Play Console configurado
- [ ] Metadata das lojas preenchida

### ✅ iOS:  
- [ ] Apple Developer account ativo
- [ ] Provisioning profiles configurados
- [ ] Archive gerado e enviado
- [ ] App Store Connect configurado
- [ ] Metadata das lojas preenchida

---

## 🔐 SEGURANÇA E BACKUP

### **CRÍTICO - GUARDAR COM SEGURANÇA:**
1. **Keystore Android** + senhas
2. **OneSignal App ID e chaves**
3. **Google Project Number** 
4. **Apple Developer certificates**
5. **Backup completo do código**

---

## 🚀 COMANDOS ESSENCIAIS

```bash
# Build completo
npm install
npm run build
npx cap sync

# Android
npx cap open android

# iOS  
npx cap open ios

# Verificar plugins
npx cap doctor
```

---

## 📞 SUPORTE

- **OneSignal Docs:** https://documentation.onesignal.com
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com