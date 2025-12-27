# 🍎 GUIA DE BUILD iOS PARA PRODUÇÃO

## 📋 PRÉ-REQUISITOS
- macOS com Xcode instalado
- Apple Developer Account ativo ($99/ano)
- Projeto sincronizado com `npx cap sync ios`

---

## 🔧 CONFIGURAÇÃO DO Info.plist

### **Localização:** `ios/App/App/Info.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>pt_BR</string>
    <key>CFBundleDisplayName</key>
    <string>PRAS Trainer</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>app.lovable.d46ecb0f56a1441da5d5bac293c0288a</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    
    <!-- PRODUÇÃO: Versioning -->
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    
    <!-- Permissões -->
    <key>NSCameraUsageDescription</key>
    <string>Este app precisa acessar a câmera para capturar fotos de progresso.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Este app precisa acessar a galeria para selecionar fotos de progresso.</string>
    <key>NSUserNotificationsUsageDescription</key>
    <string>Este app envia notificações para lembrar sobre treinos e refeições.</string>
    
    <!-- OneSignal -->
    <key>OneSignal_APNS_Environment</key>
    <string>production</string>
    
    <!-- Suporte a background -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>
    
    <!-- Orientações suportadas -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
    </array>
    
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
```

---

## 🏗️ PROCESSO DE BUILD

### **1. Preparar o Projeto:**
```bash
# Instalar dependências
npm install

# Build da aplicação web
npm run build

# Sincronizar com iOS
npx cap sync ios

# Abrir no Xcode
npx cap open ios
```

### **2. No Xcode:**

#### **A. Configurações de Projeto:**
1. **General Tab:**
   - **Display Name:** PRAS Trainer
   - **Bundle Identifier:** app.lovable.d46ecb0f56a1441da5d5bac293c0288a
   - **Version:** 1.0.0
   - **Build:** 1
   - **Deployment Target:** iOS 13.0+

2. **Signing & Capabilities:**
   - **Team:** Selecionar seu Apple Developer Team
   - **Provisioning Profile:** Automatic ou Manual
   - **Capabilities Necessárias:**
     - Push Notifications
     - Background Modes (Remote notifications)

#### **B. Configurar Certificados:**
1. **Developer Certificate:**
   - Xcode → Preferences → Accounts
   - Adicionar Apple ID da conta Developer
   - Download certificates automaticamente

2. **Provisioning Profile:**
   - Criar no Apple Developer Portal
   - Ou deixar Xcode criar automaticamente

#### **C. Preparar para Archive:**
1. **Scheme:** Selecionar "Any iOS Device (arm64)"
2. **Build Configuration:** Release
3. **Product → Archive**

---

## 📱 PROCESSO DE DISTRIBUIÇÃO

### **1. Archive e Upload:**
```
1. Product → Archive (aguardar conclusão)
2. Window → Organizer
3. Selecionar o archive criado
4. Click "Distribute App"
5. Selecionar "App Store Connect"
6. Seguir o assistente de upload
```

### **2. Configurações no App Store Connect:**

#### **A. Criar App:**
- Acesse: https://appstoreconnect.apple.com
- My Apps → + → New App
- **Platform:** iOS
- **Name:** PRAS Trainer
- **Primary Language:** Portuguese (Brazil)
- **Bundle ID:** app.lovable.d46ecb0f56a1441da5d5bac293c0288a
- **SKU:** PRASTRAINER001

#### **B. Informações do App:**
```
App Name: PRAS Trainer - Treinos e Nutrição
Subtitle: Seu personal trainer digital completo
Category: Health & Fitness
Secondary Category: Sports

Privacy Policy URL: [Seu site]/privacy-policy
Support URL: [Seu site]/support
Marketing URL: [Seu site]

Description: [Ver STORE-ASSETS-CHECKLIST.md]

Keywords: fitness,treino,academia,nutrição,dieta,exercicio,personal,saúde
```

#### **C. Screenshots Obrigatórias:**
- **iPhone 6.7":** 1290x2796px (mínimo 3)
- **iPhone 6.5":** 1242x2688px (mínimo 3) 
- **iPhone 5.5":** 1242x2208px (mínimo 3)
- **iPad Pro 12.9":** 2048x2732px (mínimo 3)

#### **D. App Icon:**
- **1024x1024px PNG**
- Sem transparência
- Sem cantos arredondados (iOS faz automaticamente)

---

## 🧪 TESTFLIGHT (Teste Beta)

### **1. Configurar TestFlight:**
```
1. App Store Connect → TestFlight
2. Selecionar o build enviado
3. Preencher informações de teste
4. Adicionar testadores internos/externos
5. Distribuir para teste
```

### **2. Teste Obrigatório:**
- [ ] App instala e abre corretamente
- [ ] Todas as funcionalidades funcionam
- [ ] Push notifications funcionam
- [ ] Performance adequada no iPhone/iPad
- [ ] UI responsiva em todos os tamanhos
- [ ] Não há crashes

---

## 📤 SUBMISSÃO PARA REVIEW

### **1. Preparar Submissão:**
```
1. App Store Connect → App Store
2. Preparar for Submission
3. Selecionar build do TestFlight
4. Preencher todas as informações obrigatórias
5. Submit for Review
```

### **2. Informações de Review:**
- **Age Rating:** 4+
- **Export Compliance:** Não (app não usa criptografia)
- **Advertising Identifier:** Não (se não usar ads)
- **Review Notes:** Explicar funcionalidades principais

### **3. Tempo de Review:**
- Primeira submissão: 24-48 horas
- Atualizações: 24 horas
- Rejeitado: Corrigir e reenviar

---

## ⚠️ PONTOS CRÍTICOS iOS

### **🔐 Certificados e Profiles:**
- Backup dos certificados (.p12)
- Provisioning profiles sempre atualizados
- Apple Developer account ativo
- Push notification certificates configurados

### **📝 Compliance:**
- Export Compliance corretamente preenchido
- Age Rating adequado (4+)
- Privacy Policy obrigatória e acessível
- Review Guidelines seguidas

### **🚨 Rejeições Comuns:**
- Crash durante review
- Funcionalidade não funciona
- Falta de informações de privacidade
- Ícone ou screenshots inadequados
- Violação das guidelines

---

## 🎯 CHECKLIST FINAL iOS

- [ ] Bundle Identifier correto
- [ ] Certificados e profiles válidos
- [ ] `CFBundleVersion` incrementado
- [ ] `CFBundleShortVersionString` atualizado
- [ ] Todas as permissões declaradas
- [ ] OneSignal configurado para produção
- [ ] Archive gerado com sucesso
- [ ] Upload para App Store Connect OK
- [ ] TestFlight testado em device real
- [ ] Screenshots de todos os tamanhos
- [ ] App Icon 1024x1024px
- [ ] Metadata completo no App Store Connect
- [ ] Privacy Policy online e acessível
- [ ] Review Notes preenchidas
- [ ] Export Compliance respondido

---

## 🔄 ATUALIZAÇÕES FUTURAS

### **Versionamento:**
```
CFBundleShortVersionString: 1.0.1 (user-facing)
CFBundleVersion: 2 (internal build number)
```

### **Processo de Update:**
1. Incrementar build number
2. Atualizar version se necessário
3. Build → Archive → Upload
4. TestFlight → Teste
5. App Store → Submit Update