# 📱 BUILD 29 - Shape Pro v4.0.0

**Data de Release:** 28 de Outubro de 2025  
**Versão Pública:** 4.0.0  
**Build Number:** 29  
**Tipo:** Re-build Técnico (Patch)

---

## 📊 Informações de Versão

| Plataforma | Identificador | BUILD 28 | BUILD 29 |
|------------|---------------|----------|----------|
| **Android** | versionCode | 28 | **29** |
| **Android** | versionName | 4.0.0 | **4.0.0** ✓ |
| **iOS** | CFBundleVersion | 28 | **29** |
| **iOS** | CFBundleShortVersionString | 4.0.0 | **4.0.0** ✓ |
| **Capacitor** | version | 28 | **29** |

---

## 🎯 Objetivo do BUILD 29

Este é um **re-build técnico** da versão 4.0.0 que mantém a mesma versão pública, mas incrementa o build number de 28 para 29. Esse tipo de release é comum quando:

- ✅ Correções de backend/database que não afetam funcionalidades visíveis
- ✅ Otimizações de performance internas
- ✅ Migrations de dados
- ✅ Ajustes em configurações nativas
- ✅ Re-submissão após rejeição de loja (sem mudanças no app)

---

## 🆕 Mudanças desde BUILD 28

### Database & Backend
- ✅ **Migration de Produtos:** Transferência do produto "Whey Protein" para instrutor correto (`2db424b4-08d2-4ad0-9dd0-971eaab960e1`)
- ✅ **RLS Policies:** Sincronização corrigida entre `products` e `instructor_id`
- ✅ **useProducts Hook:** Otimizado para carregar produtos do instrutor

### Sistema de Produtos
- ✅ Produtos agora aparecem corretamente para novos usuários vinculados ao instrutor
- ✅ Dashboard Professor preparado para gestão completa (próximo BUILD 30)
- ✅ Botão "Comprar" pronto para integração com checkout (pendente gateway de pagamento)

### Preparação para Próximas Features
- 🔜 **BUILD 30 (v4.0.1):** Integração completa do PaymentGatewayConfig no Dashboard Professor
- 🔜 **BUILD 31 (v4.1.0):** Checkout funcional com Mercado Pago/Stripe
- 🔜 **BUILD 32 (v4.1.1):** ProductManagement UI completa

---

## 🔧 Arquivos Modificados

### Capacitor Configuration
- ✅ `capacitor.config.ts` → version: "29", versionCode: 29, CFBundleVersion: '29'
- ✅ `android/app/src/main/assets/capacitor.config.json` → version: "29", versionCode: 29

### Android Configuration
- ✅ `android/app/build.gradle` → versionCode: 29

### iOS Configuration
- ✅ `ios/App/App/Info.plist` → CFBundleVersion: 29

### Scripts & Documentação
- ✅ `scripts/prepare-release.sh` → Validação automática para BUILD 29
- ✅ `docs/BUILD_29_v4.0.0_RELEASE.md` → Este documento

---

## 🏗️ Processo de Build

### Pré-requisitos
- Node.js 18+
- Android Studio (para Android)
- Xcode 15+ (para iOS, apenas em macOS)
- Capacitor CLI instalado globalmente

### 1️⃣ Preparação Automatizada

Execute o script de release que faz:
- Limpeza de builds anteriores
- Instalação de dependências
- Build da aplicação web
- Sync com plataformas nativas
- Validação de versões

```bash
chmod +x scripts/prepare-release.sh
./scripts/prepare-release.sh
```

**Saída esperada:**
```
╔════════════════════════════════════════════════════════════╗
║  Shape Pro - Release Preparation                          ║
║  BUILD 29 (v4.0.0)                                        ║
╚════════════════════════════════════════════════════════════╝

[1/6] 🧹 Limpando builds anteriores...
✓ Android build limpo
✓ iOS build limpo
✓ Dist limpo

[2/6] 📦 Instalando dependências...
✓ Dependências instaladas

[3/6] 🏗️  Building aplicação web...
✓ Build concluído

[4/6] 🔄 Sincronizando com plataformas nativas...
✓ Sync concluído

[5/6] ✅ Verificando versões...
✓ Android versionCode: 29
✓ Android versionName: 4.0.0
✓ Capacitor version: 29
✓ iOS CFBundleShortVersionString: 4.0.0
✓ iOS CFBundleVersion: 29
✓ iOS aps-environment: production

[6/6] ✅ BUILD 29 (v4.0.0) pronto para release!
```

---

### 2️⃣ Android Release Build

**Opção A: Gradle Command Line**
```bash
cd android
./gradlew clean bundleRelease

# Output esperado:
# app/build/outputs/bundle/release/app-release.aab
```

**Opção B: Android Studio**
1. Abra o projeto Android no Android Studio
2. Menu: `Build → Generate Signed Bundle / APK`
3. Selecione: `Android App Bundle`
4. Escolha keystore: `shape-pro-release-key.jks`
5. Build variant: `release`
6. Click: `Finish`

**Verificação:**
```bash
ls -lh android/app/build/outputs/bundle/release/app-release.aab
# Deve existir e ter ~15-30 MB
```

---

### 3️⃣ iOS Release Build

**Pré-requisitos:**
- macOS com Xcode 15+
- Certificados de distribuição configurados
- Provisioning Profile de produção

**Passos:**
```bash
# 1. Abrir no Xcode
npx cap open ios

# 2. No Xcode:
# - Selecione scheme: "App"
# - Selecione device: "Any iOS Device (arm64)"
# - Menu: Product → Archive
# - Aguarde o build (~5-10 minutos)

# 3. No Organizer (abre automaticamente):
# - Selecione o archive BUILD 29
# - Click: "Distribute App"
# - Escolha: "App Store Connect"
# - Opções: Upload, automatic signing
# - Click: "Upload"
```

**Verificação:**
- Aguarde email da Apple confirmando processamento do build
- Acesse App Store Connect → TestFlight
- Verifique se build 29 aparece (pode levar 5-15 minutos)

---

## ✅ Checklist Pré-Upload

### Testes Funcionais
- [ ] **Login/Autenticação:** Login com email funciona
- [ ] **Dashboard Professor:** Stats carregam corretamente
- [ ] **Produtos na Loja:** "Whey Protein" aparece em Members → Loja
- [ ] **Alunos:** Lista de alunos carrega
- [ ] **Push Notifications:** OneSignal recebe notificações
- [ ] **Permissions:** Camera/Photos solicitam corretamente

### Testes de Performance
- [ ] App inicia em menos de 3 segundos
- [ ] Navegação entre páginas é fluida (< 300ms)
- [ ] Imagens carregam progressivamente
- [ ] Sem memory leaks (use profiler)

### Testes de Compatibilidade
- [ ] Android 8.0+ (API 26+)
- [ ] iOS 13.0+
- [ ] Tablets/iPad (landscape OK)
- [ ] Diferentes tamanhos de tela

### Verificações Técnicas
- [ ] Console sem erros críticos
- [ ] Network requests retornam 200/201
- [ ] Database queries < 500ms
- [ ] OneSignal registra device corretamente

---

## 📤 Upload para Stores

### Google Play Console

1. **Acesse:** https://play.google.com/console
2. **Navegue:** Shape Pro → Produção → Criar novo release
3. **Upload:** `app-release.aab` (15-30 MB)
4. **Notas de Release:**

```
Versão 4.0.0 (Build 29)

🔧 Melhorias Técnicas:
• Otimização do sistema de produtos
• Sincronização aprimorada de dados
• Correções de performance

✨ Próximas Novidades:
• Checkout integrado para compra de produtos
• Gestão completa de produtos pelo professor
• Novos métodos de pagamento
```

5. **Revisar:** Verifique screenshots, descrição, classificação etária
6. **Enviar para Revisão:** Aguarde 1-3 dias úteis

---

### App Store Connect

1. **Acesse:** https://appstoreconnect.apple.com
2. **Navegue:** Meus Apps → Shape Pro → Versão 4.0.0
3. **Build:** Selecione build 29 (após processar no TestFlight)
4. **Notas de Release:**

```
Versão 4.0.0 (Build 29)

🔧 Melhorias e Correções:
• Sistema de produtos otimizado
• Performance aprimorada
• Sincronização de dados corrigida

Novidades em breve:
• Compra de produtos direto no app
• Dashboard do professor aprimorado
• Novos recursos de pagamento
```

5. **Informações Obrigatórias:**
   - [ ] Screenshots (6.5", 5.5", iPad Pro)
   - [ ] Descrição atualizada
   - [ ] Palavras-chave
   - [ ] URL de suporte
   - [ ] Política de privacidade
   - [ ] Classificação etária

6. **Enviar para Revisão:** Aguarde 1-7 dias úteis

---

## 🚨 Troubleshooting

### Android: Keystore não encontrado
```bash
# Verificar se keystore existe
ls -la ~/shape-pro-release-key.jks

# Se não existir, gerar novo (ATENÇÃO: não sobrescrever keystore existente!)
keytool -genkey -v -keystore ~/shape-pro-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias shape-pro-key
```

### iOS: Provisioning Profile inválido
1. Xcode: Preferences → Accounts
2. Selecione Apple ID da AtlonTech
3. Download Manual Profiles
4. Tente archive novamente

### Build falha com erro de memória
```bash
# Aumentar heap do Gradle (Android)
echo "org.gradle.jvmargs=-Xmx4096m" >> android/gradle.properties

# Limpar cache
cd android && ./gradlew clean
```

### Versões não sincronizam
```bash
# Re-executar script de preparação
./scripts/prepare-release.sh

# Se ainda falhar, verificar manualmente cada arquivo
grep -r "versionCode" android/app/
grep -r "CFBundleVersion" ios/App/App/
```

---

## 📈 Versionamento Futuro

### Próximos Builds Planejados

**BUILD 30 (v4.0.1)** - Patch
- Integração PaymentGatewayConfig
- Correções de UI do Dashboard Professor
- Hotfixes se necessário

**BUILD 31 (v4.1.0)** - Minor
- Checkout funcional com Mercado Pago
- ProductManagement completo
- Stats de vendas

**BUILD 35 (v5.0.0)** - Major
- Nova arquitetura de produtos
- Multi-tenant completo
- Redesign da UI

### Estratégia de Versionamento

- **Build Number (29, 30, 31...):** Incremento progressivo a cada upload nas stores
- **Patch (4.0.0 → 4.0.1):** Correções de bugs, otimizações internas
- **Minor (4.0.0 → 4.1.0):** Novas features pequenas, melhorias visíveis
- **Major (4.0.0 → 5.0.0):** Mudanças grandes, breaking changes, redesigns

---

## 🔐 Segurança e Backup

### Arquivos Críticos a Guardar

1. **Keystore Android:**
   - `shape-pro-release-key.jks`
   - Senhas: keystore password, key password, alias
   - **NUNCA** comitar no Git
   - Backup em cofre/vault seguro

2. **Certificados iOS:**
   - Distribution Certificate (.p12)
   - Provisioning Profiles
   - Backup via Xcode Accounts ou portal developer.apple.com

3. **Credenciais:**
   - Google Play Console: credenciais de acesso
   - App Store Connect: Apple ID + senha de app específico
   - OneSignal: API keys

### Backup Recomendado
```bash
# Criar backup de configurações críticas
mkdir -p ~/shape-pro-backups/BUILD_29
cp android/app/build.gradle ~/shape-pro-backups/BUILD_29/
cp capacitor.config.ts ~/shape-pro-backups/BUILD_29/
cp ios/App/App/Info.plist ~/shape-pro-backups/BUILD_29/
tar -czf ~/shape-pro-backups/BUILD_29.tar.gz ~/shape-pro-backups/BUILD_29/
```

---

## 📞 Suporte e Contato

**Desenvolvedor:** AtlonTech  
**App:** Shape Pro  
**Bundle ID (iOS):** com.atlontech.shapepro.aluno  
**Package Name (Android):** com.atlontech.shapepro.aluno  

**Documentação Relacionada:**
- [scripts/android-release-build.md](../scripts/android-release-build.md)
- [scripts/ios-release-build.md](../scripts/ios-release-build.md)
- [docs/BUILD_28_v4.0.0_RELEASE.md](./BUILD_28_v4.0.0_RELEASE.md)

---

## ✅ Release Checklist Final

Antes de marcar BUILD 29 como completo:

- [ ] ✅ Script `prepare-release.sh` passou sem erros
- [ ] ✅ Android AAB gerado com sucesso
- [ ] ✅ iOS Archive criado e enviado para App Store Connect
- [ ] ✅ Testes funcionais completos (login, produtos, dashboard)
- [ ] ✅ Testes de performance OK (< 3s startup)
- [ ] ✅ Console sem erros críticos
- [ ] ✅ Push notifications testadas (OneSignal)
- [ ] ✅ Notas de release escritas (PT e EN)
- [ ] ✅ Screenshots atualizadas (se necessário)
- [ ] ✅ Google Play Console: release criado e enviado
- [ ] ✅ App Store Connect: build enviado e em revisão
- [ ] ✅ Backup de keystore e certificados atualizado
- [ ] ✅ Equipe notificada sobre novo build
- [ ] ✅ Documentação atualizada (este arquivo)

---

**Status:** ✅ BUILD 29 (v4.0.0) - PRONTO PARA RELEASE

**Última Atualização:** 28/10/2025  
**Próximo Build:** BUILD 30 (v4.0.1) - Planejado para Novembro 2025
