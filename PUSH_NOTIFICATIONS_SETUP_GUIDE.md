# 🔔 Guia de Configuração Completa - Push Notifications

## ✅ O que já foi implementado:

1. **Secrets configurados no Supabase**:
   - `ONESIGNAL_APP_ID` ✅ 
   - `ONESIGNAL_API_KEY` ✅

2. **Código corrigido**:
   - `updatePlayerIdInSupabase()` agora salva o Player ID no banco ✅
   - Interface de envio no Dashboard do Professor ✅
   - Edge Function pronta para enviar notificações ✅

3. **Dashboard do Professor**:
   - Nova aba "Notificações" adicionada ✅
   - Interface completa com templates rápidos ✅
   - Validação de formulários ✅

## 🔧 Próximos passos OBRIGATÓRIOS:

### 1. Obter credenciais do OneSignal Dashboard

Acesse seu [OneSignal Dashboard](https://app.onesignal.com/) e obtenha:

- **App ID**: Encontre na seção "Settings > Keys & IDs"
- **REST API Key**: Também em "Settings > Keys & IDs" 
- **Google Project Number**: Configure FCM no Android

### 2. Configurar credenciais no Supabase

Acesse as [Edge Functions Secrets](https://supabase.com/dashboard/project/bqbopkqzkavhmenjlhab/settings/functions) e configure:

```
ONESIGNAL_APP_ID=seu_app_id_aqui
ONESIGNAL_API_KEY=seu_rest_api_key_aqui
```

### 3. Atualizar capacitor.config.ts

Substitua os placeholders em `capacitor.config.ts`:

```typescript
OneSignal: {
  appId: "SEU_APP_ID_AQUI",
  googleProjectNumber: "SEU_GOOGLE_PROJECT_NUMBER"
},
```

### 4. Para Android: Configurar FCM

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie/configure projeto Firebase
3. Baixe `google-services.json`
4. Coloque em `android/app/`
5. Configure no OneSignal Dashboard

### 5. Para iOS: Configurar APNs

1. Acesse Apple Developer Portal
2. Configure certificados APNs
3. Faça upload no OneSignal Dashboard

## 🚀 Como testar:

1. **Build e sync do projeto**:
   ```bash
   npm run build
   npx cap sync
   ```

2. **Execute em dispositivo físico**:
   ```bash
   npx cap run android
   # ou
   npx cap run ios
   ```

3. **Teste no Dashboard**:
   - Acesse "Dashboard Professor"
   - Vá na aba "Notificações"
   - Envie uma notificação teste

## 📱 Sistema atual suporta:

- ✅ Captura automática do Player ID
- ✅ Salvamento no banco de dados (`profiles.onesignal_player_id`)
- ✅ Envio para todos os alunos
- ✅ Notificações em foreground/background
- ✅ Templates rápidos para envio
- ✅ Validação de entrada
- ✅ Log de notificações enviadas
- ✅ Rate limiting e segurança
- ✅ Deep linking (configurável)

## 🔍 Debug e logs:

- Console do app móvel mostrará logs do OneSignal
- Logs da Edge Function visíveis no Supabase
- Player IDs salvos na tabela `profiles`

## ⚠️ Importante:

- Teste sempre em dispositivo físico (emulador pode não funcionar)
- Certificados iOS são obrigatórios para produção
- Android precisa do `google-services.json`
- As notificações só funcionam com credenciais reais do OneSignal

## 📋 Status atual:
- ✅ Código implementado (100%)
- ⏳ Credenciais do OneSignal (aguardando você)
- ⏳ Configuração capacitor.config.ts (aguardando você)
- ⏳ Certificados mobile (aguardando você)

---

**Próximo passo**: Configure as credenciais do OneSignal nos secrets do Supabase e no capacitor.config.ts