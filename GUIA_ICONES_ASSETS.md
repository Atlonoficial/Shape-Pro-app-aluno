# Guia de Ícones e Assets para Publicação nas Lojas

## ✅ Status Atual

O projeto já possui os ícones configurados em `public/manifest.json` com os tamanhos:
- 192x192px
- 512x512px  
- 1024x1024px

## 📱 Geração Automática de Ícones Nativos

### **Passo 1: Preparar Ícone Original**

Você precisa de **1 arquivo SVG ou PNG de alta qualidade (1024x1024px ou maior)** para gerar todos os ícones automaticamente.

Coloque o arquivo em:
```
resources/icon.png
```

### **Passo 2: Instalar Ferramenta de Geração**

```bash
npm install @capacitor/assets --save-dev
```

### **Passo 3: Gerar Ícones Automaticamente**

**Para Android:**
```bash
npx @capacitor/assets generate --android --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000'
```

Isso criará automaticamente:
- `android/app/src/main/res/drawable-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/drawable-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/drawable-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/drawable-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/drawable-xxxhdpi/ic_launcher.png` (192x192)

**Para iOS:**
```bash
npx @capacitor/assets generate --ios
```

Isso criará automaticamente:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` com todos os tamanhos necessários:
  - 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

**Para ambos de uma vez:**
```bash
npx @capacitor/assets generate
```

---

## 🖼️ Splash Screens (Tela de Abertura)

### **Android Splash Screen**

1. Criar arquivo `resources/splash.png` (2732x2732px, fundo transparente ou cor sólida)
2. Executar:
   ```bash
   npx @capacitor/assets generate --android --splashBackgroundColor '#000000'
   ```

Isso gerará:
- `android/app/src/main/res/drawable/splash.png`
- `android/app/src/main/res/drawable-land/splash.png`
- `android/app/src/main/res/drawable-port/splash.png`

### **iOS Splash Screen**

1. Usar o mesmo arquivo `resources/splash.png`
2. Executar:
   ```bash
   npx @capacitor/assets generate --ios
   ```

Isso gerará:
- `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## 📋 Assets Necessários para Google Play Store

### **Ícones e Screenshots (Obrigatórios):**

1. **Ícone do App:**
   - ✅ Já configurado em `android/app/src/main/res/drawable-*/ic_launcher.png`
   - Dimensões: 512x512px (formato PNG, 32-bit, sem transparência)

2. **Feature Graphic (Banner):**
   - Dimensão: **1024x500px**
   - Criar em: `assets-store/feature-graphic.png`
   - Deve mostrar branding do app (Shape Pro)

3. **Screenshots (mínimo 2, recomendado 8):**
   - Dimensões recomendadas:
     - **Telefone:** 1080x1920px (9:16) ou 1440x2560px
     - **Tablet (opcional):** 1920x1200px ou 2560x1600px
   - Criar em: `assets-store/screenshots/`
   - Dicas:
     - Capturar telas reais do app
     - Mostrar funcionalidades principais (treinos, IA, gamificação, nutrição)
     - Usar dispositivos com diferentes resoluções

4. **Promo Video (Opcional mas Recomendado):**
   - YouTube URL de vídeo demonstrativo (30-120 segundos)
   - Mostrar principais funcionalidades do app

---

## 🍎 Assets Necessários para Apple App Store

### **Ícones e Screenshots (Obrigatórios):**

1. **Ícone do App:**
   - ✅ Já configurado em `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Dimensão principal: 1024x1024px (sem transparência, sem bordas)

2. **Screenshots (Para App Store Connect):**
   - **iPhone 6.7" (iPhone 14 Pro Max / 15 Pro Max):** 1290x2796px (obrigatório)
   - **iPhone 6.5" (iPhone 11 Pro Max / XS Max):** 1242x2688px (obrigatório)
   - **iPhone 5.5" (iPhone 8 Plus):** 1242x2208px (opcional, mas recomendado)
   - **iPad Pro 12.9":** 2048x2732px (se suportar iPad)
   
   Criar em: `assets-store/ios-screenshots/`
   
   Dicas:
   - Capturar com simulador iOS ou dispositivo real
   - Usar Xcode → Devices and Simulators → Screenshot
   - Mínimo 3, máximo 10 screenshots por tamanho

3. **App Preview Video (Opcional):**
   - Formato: .mov ou .m4v
   - Duração: 15-30 segundos
   - Resolução: mesma dos screenshots

---

## 🎨 Recomendações de Design

### **Ícone do App:**
- Use cores vibrantes e contrastantes
- Fundo sólido ou gradiente suave
- Logo Shape Pro centralizado
- Evite textos pequenos (difícil de ler em tamanhos pequenos)
- Teste em diferentes fundos (claro e escuro)

### **Screenshots:**
- Adicione títulos descritivos em cada screenshot
- Use molduras de dispositivo para contexto
- Destaque funcionalidades únicas:
  - "Treinos Personalizados com IA"
  - "Acompanhamento Nutricional"
  - "Gamificação e Recompensas"
  - "Chat com Coach IA"
  - "Progresso Visual com Gráficos"

### **Feature Graphic (Google Play):**
- Incluir logo Shape Pro
- Texto curto e impactante: "Seu Personal Trainer IA"
- Usar cores do branding (primárias e secundárias)
- Fundo com gradiente ou imagem de treino

---

## 🔧 Ferramentas Úteis

### **Design de Ícones:**
- [Figma](https://figma.com) - Design colaborativo
- [Adobe Illustrator](https://adobe.com/illustrator) - Design vetorial
- [Canva](https://canva.com) - Templates prontos

### **Captura de Screenshots:**
- **Android:**
  - Android Studio → Emulator → Camera icon
  - `adb shell screencap -p /sdcard/screenshot.png`
  
- **iOS:**
  - Xcode → Devices → Screenshot
  - Simulador iOS → Cmd+S

### **Geração de Molduras de Dispositivo:**
- [Screely](https://screely.com) - Adiciona molduras automaticamente
- [MockUPhone](https://mockuphone.com) - Mockups gratuitos
- [Figma Mockups Plugin](https://figma.com/community) - Integração com Figma

---

## ✅ Checklist Final Antes da Publicação

### **Android (Google Play):**
- [ ] Ícone 512x512px gerado e validado
- [ ] Ícones nativos em todos os DPIs (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Feature Graphic 1024x500px criado
- [ ] Mínimo 2 screenshots de telefone (1080x1920px ou superior)
- [ ] Splash screen configurado
- [ ] `npx cap sync android` executado sem erros

### **iOS (App Store):**
- [ ] Ícone 1024x1024px gerado e validado
- [ ] AppIcon.appiconset com todos os tamanhos preenchidos
- [ ] Screenshots iPhone 6.7" (1290x2796px) - OBRIGATÓRIO
- [ ] Screenshots iPhone 6.5" (1242x2688px) - OBRIGATÓRIO
- [ ] Splash screen configurado
- [ ] `npx cap sync ios` executado sem erros

### **Ambos:**
- [ ] Build release sem erros: `npm run build`
- [ ] Testar em dispositivos físicos (Android e iOS)
- [ ] Validar que ícones aparecem corretamente
- [ ] Splash screen exibe corretamente
- [ ] Política de privacidade publicada (URL obrigatório)

---

## 🚀 Comandos Rápidos

```bash
# 1. Gerar todos os ícones automaticamente
npx @capacitor/assets generate

# 2. Build do projeto
npm run build

# 3. Sincronizar com plataformas nativas
npx cap sync

# 4. Testar em Android
npx cap run android

# 5. Testar em iOS (apenas Mac)
npx cap run ios

# 6. Gerar AAB para Google Play
cd android && ./gradlew bundleRelease

# 7. Gerar IPA para App Store (Xcode)
# Abrir ios/App/App.xcworkspace no Xcode → Product → Archive
```

---

## 📝 Notas Importantes

1. **Ícone Shape Pro:** Use o logo oficial da Shape Pro em alta resolução. Se não tiver, solicite ao designer.

2. **Cores do Branding:** Mantenha consistência com as cores definidas em `src/index.css`:
   - Primary: HSL definido no tema
   - Secondary: HSL definido no tema
   - Gradientes: Usar variáveis CSS personalizadas

3. **Testes em Dispositivos Reais:** Sempre teste em pelo menos 2 dispositivos Android e 1 iPhone antes de publicar.

4. **Google Play vs App Store:** Os requisitos são diferentes! Google Play é mais flexível, App Store é mais rigoroso.

5. **Atualizações Futuras:** Sempre que atualizar o ícone, execute `npx @capacitor/assets generate` novamente.

---

## 🆘 Solução de Problemas

**Problema:** "Icon file not found"
- **Solução:** Certifique-se de que `resources/icon.png` existe e tem no mínimo 1024x1024px

**Problema:** Ícones não aparecem no Android
- **Solução:** Limpar cache: `cd android && ./gradlew clean` e então `npx cap sync android`

**Problema:** Ícones não aparecem no iOS
- **Solução:** Abrir Xcode, verificar Assets.xcassets, e fazer "Clean Build Folder"

**Problema:** Screenshots muito grandes para upload
- **Solução:** Comprimir com TinyPNG ou similar (manter qualidade acima de 90%)

---

**Última atualização:** Dezembro 2024
