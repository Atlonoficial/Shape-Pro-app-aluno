# 📋 Checklist de Pré-Publicação - BUILD 52

## ✅ Testes Obrigatórios

### Autenticação
- [ ] Cadastro de novo usuário (iOS + Android)
- [ ] Recebimento e confirmação de email
- [ ] Login com email e senha
- [ ] Recuperação de senha
- [ ] Logout e login novamente

### Notificações Push
- [ ] Solicitar permissão de notificações
- [ ] Receber notificação de teste
- [ ] Abrir app através de notificação (deep link)
- [ ] Verificar badge de notificações não lidas

### Recursos Nativos
- [ ] Upload de foto via câmera
- [ ] Upload de foto via galeria
- [ ] Permissões de câmera funcionando
- [ ] Permissões de galeria funcionando
- [ ] Status bar e splash screen corretos

### Funcionalidades Core
- [ ] Visualizar dashboard do aluno
- [ ] Visualizar dashboard do professor
- [ ] Chat em tempo real
- [ ] Iniciar treino
- [ ] Registrar refeição
- [ ] Visualizar agenda
- [ ] Visualizar metas e recompensas

### Integrações
- [ ] Conectar Strava (deep link callback)
- [ ] Sincronizar treinos do Strava
- [ ] Comprar produto/curso
- [ ] Verificar visibilidade pública/privada de produtos
- [ ] Webhook Mercado Pago configurado e funcionando
- [ ] Pagamento libera acesso ao curso automaticamente

### Performance & UX
- [ ] App abre em < 3 segundos
- [ ] Navegação fluida entre telas
- [ ] Nenhum erro no console
- [ ] Nenhum warning de segurança crítico
- [ ] Tema claro/escuro funciona

---

## 🔧 Verificações Técnicas

### Versões (BUILD 52)
- [ ] `capacitor.config.ts` → version: "52"
- [ ] `android/app/build.gradle` → versionCode: 52
- [ ] `ios/App/App/Info.plist` → CFBundleVersion: 52
- [ ] Todas as versões sincronizadas

### Segurança
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS testadas
- [ ] Funções SQL com `search_path` explícito
- [ ] Nenhum secret exposto no código
- [ ] Leaked password protection ativado (Supabase)

### Build & Deploy
- [ ] `npm run build` sem erros
- [ ] `npx cap sync` executado
- [ ] App instalado em dispositivo físico iOS
- [ ] App instalado em dispositivo físico Android
- [ ] Nenhum crash ao abrir
- [ ] Logs de Edge Functions sem erros críticos
- [ ] Teste de pagamento sandbox completo (checkout → webhook → liberação)

---

## 📱 Publicação iOS (App Store)

### Pré-requisitos
- [ ] Conta Apple Developer ativa ($99/ano)
- [ ] Certificado de distribuição configurado
- [ ] Provisioning Profile criado
- [ ] App ID registrado no Apple Developer Portal

### Passos
1. **Abrir projeto no Xcode**
   ```bash
   open ios/App/App.xcworkspace
   ```

2. **Configurar assinatura**
   - Selecionar Target → Signing & Capabilities
   - Escolher Team e Profile correto

3. **Arquivar build**
   - Product → Archive
   - Aguardar compilação

4. **Upload para App Store Connect**
   - Window → Organizer
   - Selecionar archive → Distribute App
   - App Store Connect → Upload

5. **Preencher metadados no App Store Connect**
   - Screenshots (obrigatório: 6.5", 5.5")
   - Descrição, keywords, categoria
   - Política de privacidade URL
   - Informações de contato

6. **Submeter para revisão**
   - Add for Review → Submit

### Links úteis
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer Portal](https://developer.apple.com/account)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## 🤖 Publicação Android (Google Play)

### Pré-requisitos
- [ ] Conta Google Play Console ($25 taxa única)
- [ ] Keystore criado para assinatura
- [ ] App Bundle (AAB) gerado

### Passos
1. **Gerar release AAB**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Assinar AAB com keystore**
   ```bash
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
     -keystore shapepro-release.keystore \
     app/build/outputs/bundle/release/app-release.aab shapepro
   ```

3. **Upload no Google Play Console**
   - Production → Create new release
   - Upload AAB
   - Adicionar Release Notes

4. **Preencher metadados**
   - Screenshots (Phone, 7", 10")
   - Feature Graphic (1024x500)
   - Descrição curta e longa
   - Categoria: Health & Fitness

5. **Configurar avaliação de conteúdo**
   - Questionário de classificação etária
   - Política de privacidade URL

6. **Submeter para produção**
   - Review → Submit

### Links úteis
- [Google Play Console](https://play.google.com/console)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)

---

## 🐛 Troubleshooting Comum

### iOS não compila
- **Erro:** `No profiles for 'com.atlontech.shapepro.aluno' were found`
  - **Solução:** Criar Provisioning Profile no Apple Developer Portal

- **Erro:** `Signing for "App" requires a development team`
  - **Solução:** Xcode → Preferences → Accounts → Add Account

### Android não instala
- **Erro:** `INSTALL_FAILED_UPDATE_INCOMPATIBLE`
  - **Solução:** Desinstalar versão anterior do app

- **Erro:** `Keystore was tampered with, or password was incorrect`
  - **Solução:** Verificar senha do keystore

### Notificações não funcionam
- **iOS:** Verificar se OneSignal App ID está correto no Info.plist
- **Android:** Verificar se google-services.json está no lugar certo

### Deep links não abrem o app
- **iOS:** Verificar Associated Domains no Xcode
- **Android:** Verificar `intent-filter` no AndroidManifest.xml

---

## 📊 Métricas de Sucesso

Após publicação, monitorar:
- **Crashes:** < 1% (Firebase Crashlytics)
- **ANR (Android):** < 0.5%
- **Tempo de inicialização:** < 3s
- **Nota na loja:** > 4.0 ⭐
- **Taxa de desinstalação:** < 10%

---

## 🚀 Pós-Publicação

- [ ] Monitorar reviews nas lojas (primeiros 7 dias)
- [ ] Verificar logs de erro (Supabase Edge Functions)
- [ ] Acompanhar métricas de retenção (Google Analytics)
- [ ] Responder feedback de usuários
- [ ] Planejar próximo release (BUILD 41)

---

**Última atualização:** BUILD 52 - 04/11/2025
**Versão do app:** 4.0.0 (Build 52)
**Status:** ✅ Pronto para publicação
