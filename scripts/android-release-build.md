# 🤖 GUIA DE BUILD ANDROID PARA PRODUÇÃO

## 📋 PRÉ-REQUISITOS
- Android Studio instalado
- Projeto sincronizado com `npx cap sync android`
- Keystore gerado e configurado

---

## 🔧 CONFIGURAÇÃO DO build.gradle

### **Localização:** `android/app/build.gradle`

```gradle
android {
    namespace "app.lovable.d46ecb0f56a1441da5d5bac293c0288a"
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    defaultConfig {
        applicationId "app.lovable.d46ecb0f56a1441da5d5bac293c0288a"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        
        // PRODUÇÃO: Atualizar versioning
        versionCode 1          // Incrementar a cada release: 1, 2, 3, 4...
        versionName "1.0.0"    // Formato semântico: 1.0.0, 1.0.1, 1.1.0...
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged APK/AAB
             // ref: https://google.github.io/android-gradle-dsl/current/com.android.build.gradle.internal.dsl.AaptOptions.html
             ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            
            // PRODUÇÃO: Configuração de assinatura
            signingConfig signingConfigs.release
        }
        debug {
            applicationIdSuffix '.debug'
            versionNameSuffix '-DEBUG'
        }
    }
    
    // PRODUÇÃO: Configuração do keystore
    signingConfigs {
        release {
            if (project.hasProperty('SHAPE_PRO_RELEASE_STORE_FILE')) {
                storeFile file(SHAPE_PRO_RELEASE_STORE_FILE)
                storePassword SHAPE_PRO_RELEASE_STORE_PASSWORD
                keyAlias SHAPE_PRO_RELEASE_KEY_ALIAS
                keyPassword SHAPE_PRO_RELEASE_KEY_PASSWORD
            }
        }
    }
}
```

---

## 🔐 CONFIGURAÇÃO DO KEYSTORE

### **1. Gerar Keystore:**
```bash
keytool -genkey -v -keystore shapepro-release-key.keystore \
    -name shapepro_key -keyalg RSA -keysize 2048 -validity 25000
```

### **2. Informações para o Keystore:**
```
Nome e sobrenome: Shape Pro
Nome da unidade organizacional: Sua Empresa
Nome da organização: Sua Empresa
Nome da cidade: Sua Cidade  
Nome do estado: Seu Estado
Código do país (XX): BR
```

### **3. Arquivo gradle.properties (android/gradle.properties):**
```properties
# PRODUÇÃO: Configurações do keystore
SHAPE_PRO_RELEASE_STORE_FILE=shapepro-release-key.keystore
SHAPE_PRO_RELEASE_KEY_ALIAS=shapepro_key
SHAPE_PRO_RELEASE_STORE_PASSWORD=SUA_SENHA_KEYSTORE
SHAPE_PRO_RELEASE_KEY_PASSWORD=SUA_SENHA_KEY

# IMPORTANTE: Não commitar este arquivo no Git!
# Adicionar ao .gitignore: android/gradle.properties
```

---

## 🏗️ PROCESSO DE BUILD

### **1. Preparar o Projeto:**
```bash
# Instalar dependências
npm install

# Build da aplicação web
npm run build

# Sincronizar com Android
npx cap sync android

# Abrir no Android Studio
npx cap open android
```

### **2. No Android Studio:**

1. **Verificar Configurações:**
   - File → Project Structure
   - Verificar se o SDK está correto
   - Confirmar configurações de assinatura

2. **Gerar AAB (Android App Bundle):**
   - Build → Generate Signed Bundle / APK
   - Selecionar **Android App Bundle**
   - Escolher o keystore criado
   - Inserir senhas do keystore
   - Selecionar build type: **release**
   - Marcar V1 e V2 Signature Versions
   - Click **Create**

3. **Localização do AAB:**
   - Arquivo gerado em: `android/app/release/`
   - Nome: `app-release.aab`

---

## 📱 TESTE ANTES DA PUBLICAÇÃO

### **1. Teste Local:**
```bash
# Instalar no dispositivo físico
adb install android/app/release/app-release.apk
```

### **2. Verificações Obrigatórias:**
- [ ] App abre corretamente
- [ ] Todas as funcionalidades funcionam
- [ ] Notificações push funcionam
- [ ] Não há crashes ou erros
- [ ] Performance adequada
- [ ] UI/UX responsiva

---

## 📤 UPLOAD PARA GOOGLE PLAY

### **1. Google Play Console:**
- Acesse: https://play.google.com/console
- Criar nova aplicação
- Upload do arquivo AAB
- Preencher todas as informações obrigatórias

### **2. Informações Necessárias:**
- **Título:** Shape Pro - Treinos e Nutrição  
- **Descrição curta:** Seu personal trainer digital completo
- **Descrição completa:** (Ver STORE-ASSETS-CHECKLIST.md)
- **Screenshots:** Mínimo 2, máximo 8
- **Ícone:** 512x512px PNG
- **Política de Privacidade:** URL obrigatória
- **Classificação:** Livre para todos

---

## 🚨 PONTOS CRÍTICOS

### **⚠️ NUNCA PERDER:**
- Keystore + senhas (backup seguro!)
- Google Play Console credentials
- Documentar todas as configurações

### **🔄 Atualizações:**
- Sempre incrementar `versionCode`
- Atualizar `versionName` semanticamente
- Testar em dispositivos reais
- Validar backward compatibility

### **🛡️ Segurança:**
- Não commitar keystore no Git
- Não expor senhas em logs
- Usar ProGuard se necessário
- Validar permissões mínimas

---

## 🎯 CHECKLIST FINAL ANDROID

- [ ] `versionCode` incrementado
- [ ] `versionName` atualizado
- [ ] Keystore configurado e testado
- [ ] AAB gerado com sucesso
- [ ] Testado em dispositivo físico
- [ ] OneSignal funcionando
- [ ] Todas as funcionalidades OK
- [ ] Screenshots preparadas
- [ ] Metadata das lojas completa
- [ ] Política de privacidade online