# ✅ CHECKLIST FINAL DE PRODUÇÃO - SHAPE PRO

## 🎯 **STATUS ATUAL DO PROJETO**

### ✅ **CONCLUÍDO - Firebase Removido Completamente:**
- [x] Todas as dependências Firebase removidas
- [x] Arquivos de documentação Firebase deletados  
- [x] Códigos Firebase limpos
- [x] Configurações Firebase removidas do Capacitor
- [x] Projeto 100% Supabase + OneSignal

### ✅ **CONCLUÍDO - Preparação Base:**
- [x] Supabase configurado e funcionando
- [x] Sistema de autenticação robusto
- [x] Database com RLS policies
- [x] Edge functions implementadas
- [x] Interface completa e responsiva
- [x] Capacitor configurado
- [x] Documentação de produção criada

---

## 🚀 **PRÓXIMAS ETAPAS OBRIGATÓRIAS**

### 🔔 **1. CONFIGURAÇÃO ONESIGNAL (CRÍTICO)**
- [ ] Criar app no OneSignal Dashboard
- [ ] Obter App ID real do OneSignal
- [ ] Configurar Google Cloud Console (FCM)
- [ ] Obter Google Project Number
- [ ] Atualizar `capacitor.config.ts` com credenciais reais
- [ ] Testar notificações em dispositivo físico

### 🤖 **2. ANDROID - GOOGLE PLAY STORE**
- [ ] Gerar keystore de produção (`keytool -genkey...`)
- [ ] Configurar `android/app/build.gradle` com versioning
- [ ] Configurar assinatura no Android Studio
- [ ] Executar `npm run build && npx cap sync android`
- [ ] Gerar AAB (Android App Bundle) assinado
- [ ] Testar AAB em dispositivo físico
- [ ] Criar conta Google Play Console
- [ ] Preparar screenshots e metadata
- [ ] Upload do AAB para Google Play Console
- [ ] Preencher informações da loja
- [ ] Submeter para review

### 🍎 **3. iOS - APP STORE**
- [ ] Ativa Apple Developer Account ($99/ano)
- [ ] Configurar Bundle Identifier único
- [ ] Configurar certificados de desenvolvimento
- [ ] Atualizar `ios/App/App/Info.plist` com versioning
- [ ] Executar `npm run build && npx cap sync ios`
- [ ] Abrir projeto no Xcode
- [ ] Configurar Signing & Capabilities
- [ ] Archive da aplicação
- [ ] Upload via Xcode Organizer
- [ ] Configurar App Store Connect
- [ ] Preparar screenshots para todos os tamanhos
- [ ] Preencher metadata da loja
- [ ] Testar via TestFlight
- [ ] Submeter para review

### 📱 **4. TESTES FINAIS**
- [ ] Testar em dispositivos Android físicos
- [ ] Testar em dispositivos iOS físicos  
- [ ] Validar todas as funcionalidades core
- [ ] Testar notificações push funcionando
- [ ] Verificar performance e estabilidade
- [ ] Testar fluxo completo professor-aluno
- [ ] Validar sistema de gamificação
- [ ] Testar chat em tempo real
- [ ] Verificar sincronização de dados

---

## 📋 **ASSETS DAS LOJAS (OBRIGATÓRIO)**

### 🎨 **Ícones:**
- [ ] **Android:** 512x512px PNG (sem transparência)
- [ ] **iOS:** 1024x1024px PNG (sem transparência, sem cantos arredondados)

### 📱 **Screenshots Android:**
- [ ] Mínimo 2, máximo 8 screenshots
- [ ] Tamanho: 320px - 3840px
- [ ] Proporção 16:9 ou 9:16
- [ ] Mostrar principais funcionalidades

### 📱 **Screenshots iOS:**
- [ ] **iPhone 6.7":** 1290x2796px (mínimo 3)
- [ ] **iPhone 6.5":** 1242x2688px (mínimo 3)
- [ ] **iPhone 5.5":** 1242x2208px (mínimo 3)  
- [ ] **iPad Pro 12.9":** 2048x2732px (mínimo 3)

### 📝 **Textos das Lojas:**
- [ ] **Título:** Shape Pro - Treinos e Nutrição
- [ ] **Descrição curta:** Seu personal trainer digital completo
- [ ] **Descrição longa:** Completa e otimizada (ver STORE-ASSETS-CHECKLIST.md)
- [ ] **Palavras-chave iOS:** fitness,treino,academia,nutrição,dieta,exercicio,personal,saúde
- [ ] **Categoria:** Saúde e Fitness

---

## 🔐 **SEGURANÇA E COMPLIANCE**

### 🛡️ **Documentos Legais:**
- [ ] Política de Privacidade online e acessível
- [ ] Termos de Uso atualizados
- [ ] URLs funcionando corretamente

### 🔑 **Backup de Segurança:**
- [ ] Keystore Android + senhas salvas com segurança
- [ ] Certificados Apple Developer (.p12 backup)
- [ ] OneSignal credentials documentadas
- [ ] Google Project Number documentado
- [ ] Backup completo do código (GitHub)

### 📊 **Classificações:**
- [ ] **Android:** Classificação Livre
- [ ] **iOS:** Age Rating 4+
- [ ] Sem conteúdo adulto, violência ou apostas

---

## 🎯 **CONFIGURAÇÕES CRÍTICAS**

### ⚙️ **capacitor.config.ts:**
```typescript
// VERIFICAR SE ESTÁ ASSIM:
OneSignal: {
  appId: "SEU_ONESIGNAL_APP_ID_REAL",        // ❌ Substituir
  googleProjectNumber: "SEU_GOOGLE_PROJECT_NUMBER_REAL" // ❌ Substituir
}

// Server config comentado para produção ✅
```

### 📱 **android/app/build.gradle:**
```gradle
// VERIFICAR VERSIONING:
versionCode 1          // ✅ Incrementar a cada release
versionName "1.0.0"    // ✅ Formato semântico
```

### 🍎 **ios/App/App/Info.plist:**
```xml
<!-- VERIFICAR VERSIONING: -->
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>     <!-- ✅ User-facing version -->
<key>CFBundleVersion</key>
<string>1</string>         <!-- ✅ Build number -->
```

---

## 🚨 **PONTOS CRÍTICOS - NÃO ESQUECER**

### ⚠️ **Antes de Qualquer Build:**
1. Executar `npm install && npm run build`
2. Executar `npx cap sync android` ou `npx cap sync ios`
3. Verificar que não há erros no console
4. Testar em navegador antes de buildar mobile

### 🔄 **Versionamento:**
- Android: Incrementar `versionCode` sempre
- iOS: Incrementar `CFBundleVersion` sempre
- Ambos: Atualizar versão user-facing quando necessário

### 🧪 **Testes Obrigatórios:**
- Testar SEMPRE em dispositivo físico antes do upload
- Validar notificações push funcionando
- Verificar que não há crashes
- Testar fluxo completo do usuário

---

## 🎉 **RESULTADO ESPERADO**

### 🏆 **Ao Final Deste Checklist:**
- App Shape Pro funcionando perfeitamente
- Publicado na Google Play Store (Android)
- Publicado na Apple App Store (iOS)  
- Sistema de notificações funcionando
- Usuários podem se cadastrar e usar todas as funcionalidades
- Professores podem gerenciar alunos
- Pronto para marketing e crescimento

---

## 📞 **SUPORTE E LINKS IMPORTANTES**

### 🔗 **Dashboards:**
- **OneSignal:** https://app.onesignal.com
- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com
- **Google Cloud Console:** https://console.cloud.google.com
- **Supabase Dashboard:** https://supabase.com/dashboard

### 📚 **Documentação:**
- `PRODUCTION-SETUP-GUIDE.md` - Guia completo
- `scripts/android-release-build.md` - Build Android detalhado
- `scripts/ios-release-build.md` - Build iOS detalhado
- `STORE-ASSETS-CHECKLIST.md` - Assets das lojas

---

## ✅ **PROGRESSO ATUAL**

- [x] **FASE 1:** Limpeza completa Firebase ✅
- [x] **FASE 2:** Preparação base produção ✅  
- [ ] **FASE 3:** Configuração OneSignal real
- [ ] **FASE 4:** Build e publicação Android
- [ ] **FASE 5:** Build e publicação iOS
- [ ] **FASE 6:** Testes finais e lançamento

**Status:** 🟨 **40% Concluído - Próxima etapa: OneSignal**