# 📱 Guia de Ícones do Android - Shape Pro

## 🎯 Visão Geral

Este guia explica como atualizar o ícone do aplicativo Android do Shape Pro.

---

## 📂 Estrutura de Arquivos

O ícone do Android é composto por dois elementos:

### 1. **Background (Fundo)**
```
android/app/src/main/res/values/ic_launcher_background.xml
```
- Define a cor de fundo do ícone
- Atualmente: `#000000` (preto)

### 2. **Foreground (Logo)**
```
android/app/src/main/res/mipmap-*/ic_launcher_foreground.png
```
- Contém a imagem do logo em diferentes resoluções
- Deve ter fundo transparente (PNG com alpha channel)

---

## 🖼️ Resoluções Necessárias

O Android requer o ícone em **5 resoluções diferentes** para diferentes densidades de tela:

| Densidade | Pasta | Tamanho (px) | Uso |
|-----------|-------|--------------|-----|
| MDPI | `mipmap-mdpi` | 108×108 | Telas de baixa resolução |
| HDPI | `mipmap-hdpi` | 162×162 | Telas médias |
| XHDPI | `mipmap-xhdpi` | 216×216 | Telas de alta resolução |
| XXHDPI | `mipmap-xxhdpi` | 324×324 | Telas de muito alta resolução |
| XXXHDPI | `mipmap-xxxhdpi` | 432×432 | Telas de altíssima resolução |

---

## 🛠️ Como Atualizar o Ícone

### **Passo 1: Preparar o Logo Base**

O logo oficial do Shape Pro está em:
```
src/assets/shape-pro-logo-main.png
```

### **Passo 2: Gerar as Resoluções**

#### **Opção A: Ferramentas Online (Recomendado)**

Use uma destas ferramentas gratuitas:

1. **Icon Kitchen** (Mais fácil)
   - URL: https://icon.kitchen/
   - Faça upload do logo
   - Escolha "Foreground layer"
   - Defina background como preto (#000000)
   - Download todos os tamanhos

2. **Android Asset Studio**
   - URL: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
   - Faça upload do logo
   - Ajuste padding se necessário
   - Download o ZIP com todas as resoluções

#### **Opção B: Manual (Photoshop, GIMP, Figma)**

Para cada resolução:
1. Abra `src/assets/shape-pro-logo-main.png`
2. Redimensione para o tamanho específico (manter proporção)
3. Centralize em um canvas com fundo transparente
4. Exporte como PNG com transparência
5. Nomeie como `ic_launcher_foreground.png`

### **Passo 3: Substituir os Arquivos**

Copie os arquivos gerados para as pastas corretas:

```bash
# Exemplo de estrutura após substituição
android/app/src/main/res/
├── mipmap-mdpi/
│   └── ic_launcher_foreground.png    # 108×108px
├── mipmap-hdpi/
│   └── ic_launcher_foreground.png    # 162×162px
├── mipmap-xhdpi/
│   └── ic_launcher_foreground.png    # 216×216px
├── mipmap-xxhdpi/
│   └── ic_launcher_foreground.png    # 324×324px
└── mipmap-xxxhdpi/
    └── ic_launcher_foreground.png    # 432×432px
```

### **Passo 4: Sincronizar com Capacitor**

Após substituir os arquivos, execute:

```bash
npm run build
npx cap sync android
```

### **Passo 5: Rebuild do App**

Para ver as mudanças:

```bash
npx cap open android
```

No Android Studio:
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**
3. Execute no dispositivo/emulador

---

## ✅ Checklist de Validação

Após atualizar o ícone, verifique:

- [ ] Todos os 5 arquivos `ic_launcher_foreground.png` foram substituídos
- [ ] Cada arquivo tem a resolução correta (use `file` ou properties)
- [ ] Os arquivos têm fundo transparente (não branco)
- [ ] O ícone aparece corretamente na tela inicial do Android
- [ ] O ícone aparece corretamente no app drawer
- [ ] O ícone aparece corretamente nas notificações

---

## 🎨 Especificações do Ícone Shape Pro

### **Logo Base**
- **Fonte:** `src/assets/shape-pro-logo-main.png`
- **Cores:** Dourado/amarelo em fundo transparente
- **Estilo:** Moderno, minimalista

### **Background**
- **Cor:** `#000000` (preto)
- **Razão:** Alto contraste com logo dourado

### **Safe Zone**
- Mantenha o logo dentro de 80% da área central
- Deixe 10% de margem em cada lado
- Isso garante que o logo não seja cortado em diferentes formatos (circular, squircle, etc.)

---

## 🐛 Troubleshooting

### **Problema: Ícone não atualiza no dispositivo**

**Solução:**
```bash
# Limpar cache do Android
npx cap sync android
adb uninstall com.atlontech.shapepro.aluno
npx cap run android
```

### **Problema: Ícone aparece com borda branca**

**Causa:** Logo não tem fundo transparente

**Solução:** Reexporte o PNG com alpha channel (transparência)

### **Problema: Ícone aparece cortado**

**Causa:** Logo muito grande, sem safe zone

**Solução:** Adicione padding de 10% em cada lado

### **Problema: Ícone aparece distorcido**

**Causa:** Resolução incorreta

**Solução:** Verifique que cada arquivo tem EXATAMENTE o tamanho especificado:
```bash
file android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
# Deve mostrar: 108 x 108
```

---

## 📚 Referências

- [Android Icon Design Guidelines](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [Capacitor Icons Documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Material Design Icon Guidelines](https://material.io/design/iconography)

---

## 📝 Histórico de Mudanças

| Versão | Data | Mudança |
|--------|------|---------|
| BUILD 37 | 2025-01-XX | Documentação criada, ícones atualizados |

---

## 💡 Dicas Profissionais

1. **Use Icon Kitchen** - É a ferramenta mais fácil e gera todos os tamanhos automaticamente
2. **Teste em vários dispositivos** - O ícone pode parecer diferente em diferentes versões do Android
3. **Mantenha backup** - Guarde os arquivos originais antes de substituir
4. **Verifique o XML** - O arquivo `ic_launcher_background.xml` deve ter a cor correta
5. **Use PNG, não JPG** - PNG suporta transparência, essencial para ícones

---

**✅ BUILD 37 - Ícones Android documentados e prontos para atualização**
