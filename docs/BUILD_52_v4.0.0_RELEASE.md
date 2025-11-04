# BUILD 52 - Shape Pro v4.0.0

## 📱 Informações de Versão

| Plataforma | Build Number | Version Name |
|------------|--------------|--------------|
| Android    | 52           | 4.0.0        |
| iOS        | 52           | 4.0.0        |
| Capacitor  | 52           | 4.0.0        |

## 🎯 Objetivo do BUILD 52

**Correções críticas de UX/UI** na tela de detalhes de treino (WorkoutDetail):
- Corrigir sobreposição de stats cards com lista de exercícios
- Corrigir sobreposição do botão "Iniciar Treino" com exercícios
- Melhorar espaçamento e hierarquia visual
- Garantir consistência de versões em todas as plataformas

## 🔧 Mudanças Desde BUILD 51

### **UX/UI - WorkoutDetail.tsx**
- **Header otimizado**: Altura reduzida de 224px para 192px (h-56 → h-48)
- **Gradiente melhorado**: Opacidade aumentada para evitar transparência indesejada
  - `via-background/50` → `via-background/80`
  - `to-transparent` → `to-background/30`
- **Stats cards**: Mantidos com melhor contraste (bg-black/40 + border)
- **Espaçamento corrigido**: 
  - Lista de exercícios: `px-4 pt-6 pb-44` (176px de padding inferior)
  - Botão fixo: Posicionado em `bottom-16` (64px = altura navbar)
  - Z-index ajustado: `z-30` (abaixo da navbar z-50)
- **Botão "Iniciar Treino"**:
  - Altura reduzida: `h-16` → `h-14` (56px, ainda touch-friendly)
  - Texto menor: `text-lg` → `text-base`
  - Ícone menor: `w-6 h-6` → `w-5 h-5`
  - Container com gradiente mais alto: `pt-8`

### **Versioning - Todas as plataformas**
- **capacitor.config.ts**: v4.0.0 (BUILD 52)
- **android/app/build.gradle**: versionCode 52, versionName "4.0.0"
- **ios/App/App/Info.plist**: CFBundleVersion 52, CFBundleShortVersionString 4.0.0

## 📦 Arquivos Modificados

### **Frontend/UI**
- `src/components/workouts/WorkoutDetail.tsx`

### **Configurações de Build**
- `capacitor.config.ts`
- `android/app/build.gradle`
- `ios/App/App/Info.plist`

### **Documentação**
- `docs/BUILD_52_v4.0.0_RELEASE.md` (novo)

## ✅ Checklist de Verificação

### **Pré-Build**
- [ ] Todas as versões sincronizadas (52, v4.0.0)
- [ ] `npm install` executado
- [ ] `npm run build` sem erros
- [ ] `npx cap sync` executado

### **Testes Funcionais**
- [ ] Tela de detalhes do treino abre corretamente
- [ ] Stats cards visíveis e não sobrepõem exercícios
- [ ] Botão "Iniciar Treino" não sobrepõe exercícios
- [ ] Scroll funciona suavemente
- [ ] Bottom Navigation sempre visível
- [ ] Botão "Voltar" funciona
- [ ] Botões de "Play" (vídeo) e "Expandir" funcionam
- [ ] Modal de vídeo abre fullscreen
- [ ] Transição para WorkoutSession funciona

### **Testes Visuais**
- [ ] Header com altura adequada (192px mobile, 224px tablet)
- [ ] Gradiente sem transparência indesejada
- [ ] Stats cards com bom contraste
- [ ] Espaçamento consistente entre elementos
- [ ] Cards de exercício não cortados
- [ ] Botão "Iniciar Treino" visível e acessível
- [ ] Tipografia legível em todos os tamanhos

### **Testes de Dispositivo**
- [ ] iPhone SE (tela pequena 320px)
- [ ] iPhone 14 Pro (tela padrão 390px)
- [ ] iPhone 14 Pro Max (tela grande 428px)
- [ ] Android (diversos tamanhos)
- [ ] iPad (landscape e portrait)

## 🚀 Processo de Build

### **Preparação Automatizada**
```bash
# Execute o script de preparação
chmod +x scripts/prepare-release.sh
./scripts/prepare-release.sh
```

### **Build Android (AAB)**
```bash
cd android
./gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### **Build iOS (Xcode)**
1. Abrir `ios/App/App.xcworkspace` no Xcode
2. Product → Archive
3. Distribute App → App Store Connect

## 📊 Comparação Visual (Antes vs Depois)

### **ANTES (BUILD 51) - Problemas:**
```
┌─────────────────────────┐
│ Header (224px)          │
│ Título + Stats Cards    │ ← Stats sobrepostos
├─────────────────────────┤
│ [Exercício 1] ← cortado │
│ [Exercício 2]           │
│ [Exercício 3] ← cortado │ ← Botão sobrepondo
├═════════════════════════┤
│ [Iniciar Treino] z-10   │ ← z-index baixo
├─────────────────────────┤
│ Bottom Nav z-50         │
└─────────────────────────┘
```

### **DEPOIS (BUILD 52) - Corrigido:**
```
┌─────────────────────────┐
│ Header (192px)          │
│ Título + Stats Cards    │ ← Sem sobreposição
├─────────────────────────┤
│ [Espaço 24px]           │
│ [Exercício 1] completo  │
│ [Exercício 2] completo  │
│ [Exercício 3] completo  │
│ [Espaço 176px]          │ ← Padding adequado
├═════════════════════════┤
│ [Iniciar Treino] z-30   │ ← Não sobrepõe
├─────────────────────────┤
│ Bottom Nav z-50         │
└─────────────────────────┘
```

## 🔐 Segurança e Backup

**Arquivos críticos para backup:**
```
android/app/shape-pro-release-key.jks
ios/App/App.xcodeproj/project.pbxproj
ios/App/App/Info.plist
capacitor.config.ts
android/app/build.gradle
```

## 📝 Notas de Release (Para Lojas)

### **Google Play Store**
```
Versão 4.0.0 (Build 52) - Melhorias de Interface

✨ Novidades:
• Interface de detalhes de treino redesenhada
• Melhor visualização de informações (duração, dificuldade, calorias)
• Espaçamento otimizado para melhor legibilidade

🐛 Correções:
• Corrigido problema de sobreposição de elementos na tela de treinos
• Melhorada a visibilidade de botões e cards
• Otimizada a rolagem da lista de exercícios

🎨 Melhorias Visuais:
• Stats cards com melhor contraste
• Ícones coloridos para melhor identificação
• Hierarquia visual aprimorada
```

### **Apple App Store**
```
What's New in Version 4.0.0

✨ Interface Improvements:
• Redesigned workout details screen
• Better visibility of workout stats (duration, difficulty, calories)
• Optimized spacing for better readability

🐛 Bug Fixes:
• Fixed overlapping elements on workout screen
• Improved button and card visibility
• Optimized exercise list scrolling

🎨 Visual Enhancements:
• Stats cards with better contrast
• Colorful icons for better identification
• Improved visual hierarchy
```

## 🆘 Troubleshooting

### **Problema: Versões não sincronizadas**
```bash
# Verificar versões
grep -r "versionCode\|versionName\|CFBundleVersion" android/ ios/ capacitor.config.ts

# Forçar sync
npx cap sync --force
```

### **Problema: Build Android falha**
```bash
# Limpar cache Gradle
cd android
./gradlew clean
./gradlew bundleRelease --stacktrace
```

### **Problema: Xcode não encontra versão correta**
```bash
# Limpar build do iOS
cd ios/App
rm -rf build/ DerivedData/
pod install --repo-update
```

## 📞 Suporte

- **Documentação anterior**: `docs/BUILD_29_v4.0.0_RELEASE.md`
- **Scripts**: `scripts/prepare-release.sh`

---

**BUILD 52 - Shape Pro v4.0.0**  
*Data de Build: 04/11/2025*  
*Correções críticas de UX/UI + sincronização de versões*
