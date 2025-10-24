# 🚀 BUILD 27 - VERSÃO 3.0.1 - CORREÇÃO DE BUGS VISUAIS E STRAVA MOBILE

**Data:** 2025-10-24  
**Versão:** 3.0.1 Build 27

---

## 🎯 OBJETIVO

Correção de bugs visuais críticos e implementação de solução híbrida para Strava OAuth no mobile usando Universal Links / App Links.

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. 🔧 **STRAVA MOBILE - ESTRATÉGIA HÍBRIDA** (CRÍTICO)

**Problema:** Strava não aceita `shapepro://` como redirect URI registrado

**Solução Implementada:**
- ✅ **Backend (`strava-auth`)**: Sempre usa web callback `https://...lovableproject.com/strava-callback`
- ✅ Adiciona `?platform=mobile` como query param para identificar origem mobile
- ✅ **Frontend (`StravaCallback.tsx`)**: Detecta `platform=mobile` e faz redirect interno para app
- ✅ **iOS Universal Links**: Criado `.well-known/apple-app-site-association` e `App.entitlements`
- ✅ **Android App Links**: Adicionado intent-filter para `/strava-callback` no `AndroidManifest.xml`
- ✅ **Deep Link Handler**: Suporte para `shapepro://app/configuracoes` após callback

**Fluxo Esperado:**
1. Usuário clica "Conectar Strava" no app mobile
2. Browser abre com Strava OAuth (web URL)
3. Usuário autoriza no Strava
4. Strava redireciona para `https://...lovableproject.com/strava-callback?platform=mobile&code=xxx`
5. **iOS/Android intercepta automaticamente** via Universal/App Link
6. App processa callback, fecha browser, salva token
7. Redireciona internamente para `/configuracoes`

**Arquivos Modificados:**
- `supabase/functions/strava-auth/index.ts`
- `src/pages/StravaCallback.tsx`
- `src/hooks/useStravaIntegration.ts`
- `src/utils/deepLinkHandler.ts`

**Arquivos Criados:**
- `public/.well-known/apple-app-site-association` (iOS Universal Links)
- `ios/App/App/App.entitlements` (Associated Domains)
- Modificado `android/app/src/main/AndroidManifest.xml` (App Links)

---

### 2. 💬 **CHAT - INPUT CORTADO PELA BOTTOM NAV**

**Problema:** Input de mensagem sobreposto pela bottom navigation

**Solução:**
- ✅ Input agora usa `position: fixed` com `z-index: 45` (acima da bottom nav que é 40)
- ✅ Chat messages têm padding-bottom de 80px para não ficarem escondidos
- ✅ Adicionado `pb-safe` para respeitar safe area do iPhone
- ✅ Novo z-index layer: `--z-message-input: 45`

**Arquivos Modificados:**
- `src/pages/Chat.tsx`
- `src/components/chat/MessageInput.tsx`
- `src/styles/z-index.css`

---

### 3. 👤 **AVATAR CORTADO PELA SAFE AREA**

**Problema:** Avatar no dashboard cortado pelo notch/Dynamic Island do iPhone

**Solução:**
- ✅ Dashboard usa `pt-safe` no container principal
- ✅ Logo tem padding-top adicional de 2 (`pt-2`)
- ✅ Avatar completamente visível em todos os devices

**Arquivos Modificados:**
- `src/components/dashboard/Dashboard.tsx`

---

### 4. 🏷️ **BADGE "NOVO" MAL POSICIONADO**

**Problema:** Badge "Novo" sobrepunha conteúdo em cards

**Solução:**
- ✅ Mudou de `absolute -top-2 -right-2` para `absolute top-1 right-1`
- ✅ Badge agora fica **dentro** do card sem sobrepor conteúdo adjacente
- ✅ Aplicado em ambos os casos (percentage === 0 e status === 'new')

**Arquivos Modificados:**
- `src/components/ui/DynamicBadge.tsx`

---

### 5. 📦 **ATUALIZAÇÃO DE VERSÃO**

Todos os arquivos de versão atualizados para **3.0.1 Build 27**:

- ✅ `capacitor.config.ts`: version = "3.0.1"
- ✅ `package.json`: version = "3.0.1"
- ✅ `android/app/src/main/assets/capacitor.config.json`: versionCode = 27, versionName = "3.0.1"
- ✅ `ios/App/App/Info.plist`: CFBundleVersion = "27", CFBundleShortVersionString = "3.0.1"

---

## 📱 INSTRUÇÕES DE TESTE

### **iOS:**

1. **Strava Universal Link:**
   ```bash
   git pull
   npm install
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **No Xcode:**
   - Verificar se `App.entitlements` tem os Associated Domains corretos
   - Verificar se `Info.plist` tem CFBundleVersion = "27"
   - Build e executar em device real (Universal Links não funcionam em simulador)

3. **Testar Strava:**
   - Abrir app → Configurações → Conectar Strava
   - Autorizar no Strava
   - **Universal Link deve interceptar** e abrir o app automaticamente
   - Verificar se salva e mostra "Conectado"

### **Android:**

1. **Strava App Link:**
   ```bash
   git pull
   npm install
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **No Android Studio:**
   - Verificar `AndroidManifest.xml` tem intent-filters para `/strava-callback`
   - Verificar `capacitor.config.json` tem versionCode = 27
   - Build e executar em device real ou emulador

3. **Testar Strava:**
   - Abrir app → Configurações → Conectar Strava
   - Autorizar no Strava
   - **App Link deve interceptar** e abrir o app automaticamente
   - Verificar se salva e mostra "Conectado"

### **Verificar Chat:**
- ✅ Input de mensagem sempre visível acima da bottom nav
- ✅ Keyboard empurra input corretamente
- ✅ Scroll do chat não cobre input

### **Verificar Avatar:**
- ✅ Avatar no dashboard visível em iPhones com notch/Dynamic Island
- ✅ Espaçamento adequado do topo

### **Verificar Badge "Novo":**
- ✅ Badge "Novo" em "Anamnese" bem posicionado
- ✅ Não sobrepõe texto ou conteúdo adjacente

---

## 🔍 ARQUIVOS MODIFICADOS (17 arquivos)

### Backend:
1. `supabase/functions/strava-auth/index.ts`

### Frontend:
2. `src/pages/StravaCallback.tsx`
3. `src/hooks/useStravaIntegration.ts`
4. `src/pages/Chat.tsx`
5. `src/components/chat/MessageInput.tsx`
6. `src/components/dashboard/Dashboard.tsx`
7. `src/components/ui/DynamicBadge.tsx`
8. `src/utils/deepLinkHandler.ts`
9. `src/styles/z-index.css`

### Configuração iOS:
10. `ios/App/App/Info.plist`
11. `ios/App/App/App.entitlements` (novo)
12. `public/.well-known/apple-app-site-association` (novo)

### Configuração Android:
13. `android/app/src/main/AndroidManifest.xml`
14. `android/app/src/main/assets/capacitor.config.json`

### Versão:
15. `capacitor.config.ts`
16. `package.json`
17. `BUILD_27_CHANGELOG.md` (este arquivo)

---

## ⚠️ NOTAS IMPORTANTES

### **Universal Links / App Links:**

1. **iOS Universal Links:**
   - Requer `.well-known/apple-app-site-association` na raiz do domínio (public/)
   - Requer `App.entitlements` com Associated Domains
   - **IMPORTANTE:** Trocar `TEAMID` no `.well-known/apple-app-site-association` pelo seu Team ID real da Apple
   - Só funciona em device real, não no simulador
   - Domínio deve ser HTTPS

2. **Android App Links:**
   - Requer `intent-filter` com `android:autoVerify="true"`
   - Requer Digital Asset Links (`.well-known/assetlinks.json`) - a ser configurado no servidor
   - Funciona em emulador e device real
   - Domínio deve ser HTTPS

### **Próximos Passos:**

1. ✅ Configurar Team ID correto no `.well-known/apple-app-site-association`
2. ✅ Hospedar `.well-known/apple-app-site-association` no domínio production
3. ✅ Configurar `.well-known/assetlinks.json` para Android (quando tiver domínio custom)
4. ✅ Testar em devices reais iOS e Android
5. ✅ Verificar que Strava aceita a web callback URL no painel de desenvolvedor

---

## 🎉 RESULTADO ESPERADO - BUILD 27

✅ **Strava funciona perfeitamente no mobile** via Universal/App Links  
✅ **Chat com input sempre visível** e corretamente posicionado  
✅ **Avatar não cortado** pela safe area do iPhone  
✅ **Badge "Novo" bem posicionado** sem overlap  
✅ **Zero bugs visuais críticos**  
✅ **Pronto para testes finais** antes da produção 🚀

---

**Status:** ✅ IMPLEMENTADO - AGUARDANDO TESTES EM DEVICE REAL
