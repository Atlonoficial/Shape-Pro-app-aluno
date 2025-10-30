# Shape Pro - Assets para as Lojas

## 📱 ÍCONES NECESSÁRIOS

### iOS App Store
- **1024x1024px** - Ícone principal (já gerado: `public/icon-1024x1024.png`)
- **180x180px** - Apple Touch Icon (já existe: `public/apple-touch-icon.png`)

### Google Play Store  
- **512x512px** - Ícone principal (já existe: `public/icon-512x512.png`)
- **192x192px** - Ícone adaptativo (já existe: `public/icon-192x192.png`)

## 📸 SCREENSHOTS NECESSÁRIOS

### iPhone (Obrigatório)
- **1290x2796px** - iPhone 14 Pro Max (6.7")
- **1179x2556px** - iPhone 14 Pro (6.1") 
- **1284x2778px** - iPhone 12 Pro Max (6.7")
- **1170x2532px** - iPhone 12 Pro (6.1")

### iPad (Opcional mas recomendado)
- **2048x2732px** - iPad Pro 12.9" (3ª geração)
- **1668x2388px** - iPad Pro 11" 

### Android (Obrigatório)
- **1080x1920px** - Phone Portrait
- **1920x1080px** - Phone Landscape  
- **1200x1920px** - 7" Tablet Portrait
- **1920x1200px** - 10" Tablet Landscape

## 🎨 SPLASH SCREENS

### iOS
- **1080x1920px** - Universal (já gerado: `public/splash-1080x1920.png`)
- **1290x2796px** - iPhone 14 Pro Max
- **2048x2732px** - iPad Pro 12.9"

### Android
- **1080x1920px** - mdpi to xxxhdpi (já gerado)
- **Recursos adicionais:** `android/app/src/main/res/drawable/splash.png`

## 📝 DESCRIÇÕES PARA AS LOJAS

### Nome do App
- **Português:** Shape Pro - Fitness & Coach IA
- **Inglês:** Shape Pro - Fitness & AI Coach

### Descrição Curta (80 caracteres)
- **Português:** Fitness profissional com Coach IA e treinos personalizados
- **Inglês:** Professional fitness with AI Coach and personalized workouts

### Descrição Completa
- **Português:** [Ver arquivo: store-description-pt.md]
- **Inglês:** [Ver arquivo: store-description-en.md]

## 🏷️ PALAVRAS-CHAVE

### App Store (100 caracteres)
fitness,treino,academia,coach,ia,dieta,saude,exercicio,personal,nutricao

### Google Play (Tags separadas)
- Fitness
- Treino Personalizado  
- Coach IA
- Nutrição
- Academia
- Saúde
- Exercícios
- Personal Trainer
- Dieta
- Bem-estar

## 🎯 CATEGORIAS

### App Store
- **Principal:** Health & Fitness
- **Secundária:** Lifestyle

### Google Play
- **Principal:** Health & Fitness
- **Tags:** Fitness, Nutrition, Personal Training

## 📊 CLASSIFICAÇÃO ETÁRIA

### App Store
- **4+** - Appropriate for All Ages

### Google Play  
- **Everyone** - Appropriate for All Ages
- **Content Rating:** General Audience

## 🔒 CONFIGURAÇÕES DE PRIVACIDADE

### Dados Coletados
- ✅ Email (autenticação)
- ✅ Fotos de progresso (opcional)
- ✅ Dados de treino (progresso)
- ✅ Preferências alimentares
- ❌ Localização (não coletada)
- ❌ Contatos (não coletados)

### Uso dos Dados
- Personalização de treinos
- Acompanhamento de progresso  
- Coach IA personalizado
- Sincronização entre dispositivos

## 📄 DOCUMENTOS NECESSÁRIOS

1. **Política de Privacidade** (URL obrigatória)
2. **Termos de Serviço** (URL obrigatória)  
3. **Suporte/Contato** (Email obrigatório)
4. **Site do App** (URL recomendada)

## 💰 MODELO DE MONETIZAÇÃO

- **Freemium:** Recursos básicos gratuitos
- **Assinaturas:** Premium mensal/anual
- **In-App Purchases:** Planos personalizados
- **Sem anúncios:** Experiência premium

## 🧪 TESTES NECESSÁRIOS

### Antes do Submit
- [ ] Funcionalidade completa em dispositivos reais
- [ ] Teste de performance e battery usage
- [ ] Verificação de memory leaks
- [ ] Teste de conectividade (online/offline)
- [ ] Validação de todas as permissões
- [ ] Teste de push notifications
- [ ] Verificação de deep links
- [ ] Teste de IAP/assinaturas

### Dispositivos de Teste Recomendados
- **iOS:** iPhone SE, iPhone 14, iPad Air
- **Android:** Samsung Galaxy S21, Pixel 6, Tablet genérico

---
**Geração automática:** `node scripts/build-mobile.js both --prod`