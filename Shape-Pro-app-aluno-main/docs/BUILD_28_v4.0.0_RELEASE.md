# BUILD 28 - v4.0.0 (2025-01-XX)

## 🚀 Major Update - Nova Era do Shape Pro

## ⚠️ CORREÇÃO CRÍTICA - Build Number

### 🔴 Problema Identificado:
Apple Store rejeitou BUILD 1 porque já existe BUILD 27 (v3.0.1) publicado. A Apple não aceita build numbers menores que o último aprovado.

### ✅ Solução Implementada:
- **Version Name (user-facing):** 4.0.0 (major update)
- **Build Number (interno):** 28 (progressivo de 27)
- **Motivo:** Build numbers devem SEMPRE ser progressivos na App Store

### 📊 Esquema de Versionamento Corrigido:
| Versão  | Build Number | Uso                    |
|---------|--------------|------------------------|
| 4.0.0   | 28          | Major update atual     |
| 4.0.1   | 29          | Hotfix/patch           |
| 4.0.2   | 30          | Hotfix/patch           |
| 4.1.0   | 35          | Minor feature update   |
| 5.0.0   | 50+         | Next major update      |

### ⚠️ IMPORTANTE:
**NUNCA** mais usar build number menor que 28. Build numbers são sempre progressivos e não podem ser "resetados" sem remover o app completamente da loja (não recomendado).

### ✨ Mudanças Principais
- Versão major bump para 4.0.0
- Reset do build number para 1 (nova numeração)
- Preparação completa para upload nas lojas
- **CRÍTICO:** iOS `aps-environment` corrigido para `production`

### 📦 Versões
- **Version Name:** 4.0.0
- **Version Code/Build Number:** 28 (progressivo)
- **iOS CFBundleShortVersionString:** 4.0.0
- **iOS CFBundleVersion:** 28

### 🔧 Correções Técnicas

#### 1. iOS Push Notifications (CRÍTICO) ⚠️
```xml
<!-- ANTES (ERRADO - App Store rejeita) -->
<key>aps-environment</key>
<string>development</string>

<!-- DEPOIS (CORRETO) -->
<key>aps-environment</key>
<string>production</string>
```

#### 2. Versões Sincronizadas
Todos os arquivos atualizados para BUILD 1 (v4.0.0):
- ✅ `capacitor.config.ts`
- ✅ `android/app/build.gradle`
- ✅ `android/app/src/main/assets/capacitor.config.json`
- ✅ `ios/App/App/App.entitlements`

#### 3. Configurações de Produção
- iOS: OneSignal production mode habilitado
- Android: Pronto para release signing
- Todos os assets validados

### 📱 Plataformas

#### Android (Google Play Store)
```bash
# Gerar AAB para upload
cd android
./gradlew bundleRelease
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

**Requisitos:**
- Keystore configurado em `gradle.properties`
- Release signing configurado em `build.gradle`
- Metadata e screenshots preparados

#### iOS (Apple App Store)
```bash
# Preparar e abrir Xcode
npm run build
npx cap sync ios
npx cap open ios
```

**No Xcode:**
1. Product → Archive
2. Organizer → Distribute App → App Store Connect

**Requisitos:**
- Bundle ID: `com.atlontech.shapepro.aluno`
- Certificado de Distribuição ativo
- Provisioning Profile válido
- App criado no App Store Connect

### ✅ Checklist de Deploy

#### Pré-Upload
- [x] Versões atualizadas (BUILD 1, v4.0.0)
- [x] iOS: `aps-environment` = `production`
- [x] Android: Keystore configurado
- [x] Build limpo e testado
- [x] Assets preparados (ícones, screenshots)

#### Android - Google Play Console
- [ ] App bundle (.aab) gerado
- [ ] Keystore em backup seguro
- [ ] Metadata preenchida (título, descrição, keywords)
- [ ] Screenshots uploaded (1080x1920px mínimo)
- [ ] Feature Graphic (1024x500px)
- [ ] App Icon (512x512px)
- [ ] Privacy Policy URL configurada
- [ ] Classificação de conteúdo preenchida

#### iOS - App Store Connect
- [ ] Archive criado e validado
- [ ] App criado no App Store Connect
- [ ] Metadata preenchida
- [ ] Screenshots uploaded (6.7", 6.5", iPad)
- [ ] App Icon (1024x1024px)
- [ ] Privacy Policy e Support URL
- [ ] Keywords configuradas
- [ ] Age Rating configurado

### 📝 Instruções de Build

#### Preparação (Ambas as Plataformas)
```bash
# 1. Limpar e instalar
rm -rf node_modules dist
npm install

# 2. Build da aplicação
npm run build

# 3. Sync com plataformas
npx cap sync

# 4. Verificar versões
grep "versionCode 1" android/app/build.gradle
grep '"version": "1"' android/app/src/main/assets/capacitor.config.json
```

#### Android Release Build
```bash
# 1. Configurar gradle.properties (NÃO commitar!)
echo "MYAPP_RELEASE_STORE_FILE=shape-pro-release.keystore" >> android/gradle.properties
echo "MYAPP_RELEASE_KEY_ALIAS=shapepro" >> android/gradle.properties
echo "MYAPP_RELEASE_STORE_PASSWORD=SUA_SENHA" >> android/gradle.properties
echo "MYAPP_RELEASE_KEY_PASSWORD=SUA_SENHA" >> android/gradle.properties

# 2. Gerar release bundle
cd android
./gradlew bundleRelease

# 3. Verificar output
ls -lh app/build/outputs/bundle/release/app-release.aab
```

#### iOS Release Build
```bash
# 1. Abrir Xcode
npx cap open ios

# 2. No Xcode:
# - Selecionar scheme "App"
# - Selecionar "Any iOS Device"
# - Product → Archive
# - Aguardar conclusão (~5-10 min)

# 3. No Organizer:
# - Selecionar o archive
# - Validate App (recomendado)
# - Distribute App → App Store Connect
# - Upload to App Store
```

### 🔐 Segurança e Backup

#### Android Keystore (CRÍTICO!)
⚠️ **FAZER BACKUP IMEDIATAMENTE:**
```bash
# Keystore location
android/app/shape-pro-release.keystore

# Backup seguro
cp android/app/shape-pro-release.keystore ~/backups/shapepro-keystore-$(date +%Y%m%d).keystore

# Guardar senhas em gerenciador seguro (1Password, Bitwarden, etc.)
```

**⚠️ ATENÇÃO:** Perder o keystore = impossível atualizar o app!

#### Secrets a Proteger
- ❌ NÃO commitar: `gradle.properties` com senhas
- ❌ NÃO commitar: Keystore (`.keystore`, `.jks`)
- ❌ NÃO commitar: Provisioning profiles (`.mobileprovision`)
- ✅ Manter em `.gitignore`

### 🎯 Upload para as Lojas

#### Google Play Console
1. Acesse: https://play.google.com/console
2. Selecione "Shape Pro"
3. Release → Production → Create new release
4. Upload: `app-release.aab`
5. Preencha Release Notes
6. Review e Submit

#### App Store Connect
1. Acesse: https://appstoreconnect.apple.com
2. My Apps → Shape Pro
3. Aguardar processamento do upload (~10-30 min)
4. Preencher metadata se primeira versão
5. Submit for Review

### ⚠️ Problemas Comuns e Soluções

#### Android: "Invalid Keystore"
```bash
# Verificar keystore
keytool -list -v -keystore android/app/shape-pro-release.keystore

# Re-gerar se necessário (APENAS PRIMEIRA VEZ!)
keytool -genkey -v -keystore shape-pro-release.keystore \
  -alias shapepro -keyalg RSA -keysize 2048 -validity 10000
```

#### iOS: "No Provisioning Profile"
1. Xcode → Preferences → Accounts
2. Selecionar Apple ID
3. Download Manual Profiles
4. Project Settings → Signing & Capabilities
5. Refresh Provisioning Profiles

#### iOS: "Invalid Push Notification Entitlement"
✅ **JÁ CORRIGIDO neste build!**
- `aps-environment` agora está `production`
- Se ainda aparecer, verificar se rodou `npx cap sync ios`

### 🔄 Versionamento Futuro

#### Scheme de Versões
```
MAJOR.MINOR.PATCH (BUILD)

4.0.0 (BUILD 1)  ← Atual
4.0.1 (BUILD 2)  ← Hotfixes
4.1.0 (BUILD 3)  ← Minor features
5.0.0 (BUILD 4)  ← Breaking changes
```

#### Regras
- **MAJOR (4.x.x):** Mudanças significativas, novas features principais
- **MINOR (x.1.x):** Novas features, sem breaking changes
- **PATCH (x.x.1):** Bug fixes, melhorias pequenas
- **BUILD:** Sempre incremental (1, 2, 3, 4...)

⚠️ **IMPORTANTE:** Google Play não aceita versionCode menor que anterior!

---

## 🎨 Correção de Ícones - BUILD 28 (Atualização Pós-Release)

### Data: 2025-10-28

### Problema Identificado
Ícones iOS e Android exibindo **borda verde indesejada** em todas as plataformas.

### Solução Implementada

#### Android (16 arquivos - 100% completo)
- Substituídos todos os ícones em 5 densidades (mdpi → xxxhdpi)
- 15 arquivos PNG: `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`
- Mantidos adaptive icons (Android 8.0+)
- Incluído `playstore-icon.png` (512x512) para Google Play

#### iOS (41 arquivos - essenciais completos)
- Substituídos todos os ícones do AppIcon.appiconset
- 17 ícones essenciais (iPhone, iPad)
- 24 ícones extras (macOS, watchOS)
- Atualizado `Contents.json` com mapeamento completo
- Incluído ícone App Store (1024x1024)

### Origem dos Ícones
- Ícones oficiais gerados pelo designer (sem borda verde)
- Armazenados temporariamente em: Supabase bucket `app-icons`
- Integrados via download automatizado: 57 arquivos

### Arquivos Modificados
```
android/app/src/main/playstore-icon.png
android/app/src/main/res/mipmap-mdpi/ic_launcher*.png (3)
android/app/src/main/res/mipmap-hdpi/ic_launcher*.png (3)
android/app/src/main/res/mipmap-xhdpi/ic_launcher*.png (3)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher*.png (3)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher*.png (3)
ios/App/App/Assets.xcassets/AppIcon.appiconset/* (41 arquivos)
```

### Versão Mantida
- ✅ BUILD 28 (v4.0.0) - **sem mudanças de versão**
- ✅ Nenhuma alteração em configurações ou código
- ✅ Apenas substituição de assets (ícones)

### Validação Necessária
- [ ] Xcode: Todos os tamanhos preenchidos, sem avisos
- [ ] Android Studio: Preview correto em todas as densidades
- [ ] iPhone físico: Ícone aparece sem borda verde
- [ ] Android físico: Ícone aparece sem borda verde

### Documentação Completa
Ver: `docs/ICONS_IMPLEMENTATION.md`

---

## 🔧 Correção Info.plist - BUILD 28 (Upload iOS Fix)

### Data: 2025-10-28

### Problema Identificado
Build #67 falhou no upload para App Store devido a:
1. ❌ `Info.plist` com versão antiga (3.0.1 build 27)
2. ❌ Falta de `NSUserNotificationsUsageDescription`
3. ❌ Falta de `OneSignal_APNS_Environment` production

### Solução Implementada
1. ✅ Atualizado `CFBundleShortVersionString` para 4.0.0
2. ✅ Atualizado `CFBundleVersion` para 28
3. ✅ Adicionado `NSUserNotificationsUsageDescription`
4. ✅ Adicionado `OneSignal_APNS_Environment` = production
5. ✅ Corrigido locale para pt_BR

### Arquivos Modificados
```
ios/App/App/Info.plist
docs/BUILD_28_v4.0.0_RELEASE.md
```

### Validação
- [x] Versões sincronizadas com capacitor.config.ts
- [x] Todas as permissões declaradas
- [x] OneSignal production mode habilitado
- [ ] Rebuild e upload para App Store Connect

### Próximos Passos para Upload
1. Git pull no projeto local
2. `npx cap sync ios`
3. `npx cap open ios`
4. Product → Clean Build Folder
5. Product → Archive
6. Upload para App Store Connect

### Mudanças Aplicadas

| Item | Antes (❌ Errado) | Depois (✅ Correto) |
|------|------------------|---------------------|
| Version | 3.0.1 | 4.0.0 |
| Build | 27 | 28 |
| Locale | en | pt_BR |
| Notificações | ❌ Falta permissão | ✅ NSUserNotificationsUsageDescription |
| OneSignal Env | ❌ Não configurado | ✅ production |

---

### 📚 Documentação Relacionada
- `scripts/android-release-build.md` - Guia completo Android
- `scripts/ios-release-build.md` - Guia completo iOS
- `scripts/store-assets.md` - Assets e metadata das lojas
- `docs/BUILD_28_v3.0.1_LEGACY.md` - Build anterior (referência)

### 🎉 Sucesso!

Após upload bem-sucedido:
- **Android:** Review automático (2-48h geralmente)
- **iOS:** Review manual (1-3 dias geralmente)

Monitor status:
- Android: Play Console → Release → Production
- iOS: App Store Connect → My Apps → Shape Pro → Activity

### 📞 Suporte

**Problemas com upload:**
- Android: https://support.google.com/googleplay/android-developer
- iOS: https://developer.apple.com/support/

**Comunidade Shape Pro:**
- GitHub Issues
- Email: suporte@shapepro.com

---

**BUILD 1 (v4.0.0) - Ready for Production! 🚀**
