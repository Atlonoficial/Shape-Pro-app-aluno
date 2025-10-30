# 🔔 Configuração OneSignal - Shape Pro

## 🏗️ Arquitetura

⚠️ **ATENÇÃO:** Este projeto NÃO usa a arquitetura descrita em `APP_ALUNO_ONESIGNAL_SETUP.md`.

**Arquitetura atual (BUILD 36):**
- ✅ `src/lib/push.ts` - Core OneSignal
- ✅ `src/components/auth/AuthProvider.tsx` - Inicialização automática
- ✅ Sem hooks separados (`useOneSignal`)
- ✅ Sem componentes separados (`OneSignalInitializer`)

**Ver:** `docs/ONESIGNAL_ARCHITECTURE.md` para detalhes completos da arquitetura.

---

## 📋 Status Atual (BUILD 36)

### ✅ O que está funcionando
- ✅ SDK integrado (web + mobile)
- ✅ External User ID configurado automaticamente no login
- ✅ Edge Function `send-push-notification` implementada
- ✅ Service Workers configurados
- ✅ Integração com Supabase (tabela `profiles` + `notification_logs`)

### ⚠️ O que precisa ser configurado

#### 1. **Secrets do Supabase** (CRÍTICO)
Os seguintes secrets precisam ser configurados no Supabase Vault:

```bash
ONESIGNAL_API_KEY=seu_rest_api_key_aqui
ONESIGNAL_APP_ID=be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82
```

**Como obter o REST API Key:**
1. Acesse: https://dashboard.onesignal.com/apps/be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82
2. Vá em **Settings > Keys & IDs**
3. Copie o **REST API Key**

**Como adicionar no Supabase:**
1. Acesse: https://supabase.com/dashboard/project/bqbopkqzkavhmenjlhab/settings/vault/secrets
2. Clique em **New secret**
3. Adicione `ONESIGNAL_API_KEY` e `ONESIGNAL_APP_ID`

#### 2. **Player IDs vazios no banco**
Atualmente, nenhum usuário tem `onesignal_player_id` configurado porque:
- Nenhum usuário aceitou as permissões de push ainda
- Ou as permissões foram negadas/não solicitadas

**Solução:**
- Solicitar permissões na primeira abertura do app
- Testar em um dispositivo real (físico ou emulador)
- Verificar logs no console para confirmar Player ID

---

## 🧪 Como Testar

### **Teste 1: Verificar Edge Function**
```bash
# Testar se a função está respondendo
curl -X POST https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/send-push-notification \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm9wa3F6a2F2aG1lbmpsaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjEwMTQsImV4cCI6MjA3MDQ5NzAxNH0.AeqAVWHVqyAn7wxNvHeuQFkJREHUTB9fZP22qpv73d0" \
  -d '{
    "title": "Teste BUILD 28",
    "message": "Notificação de teste",
    "target_users": ["user-id-aqui"]
  }'

# Resposta esperada (se sem Player IDs):
# {"error": "No player IDs found for target users"}
```

### **Teste 2: Verificar Player IDs no Banco**
```sql
-- Ver usuários com Player IDs configurados
SELECT 
  id,
  email,
  user_type,
  onesignal_player_id,
  notification_settings
FROM profiles
WHERE onesignal_player_id IS NOT NULL;

-- Resultado esperado: Pelo menos 1 usuário com Player ID
```

### **Teste 3: Aceitar Permissões no App**
1. **Mobile:** Abra o app em um dispositivo físico
2. **Web:** Abra no navegador (Chrome/Firefox)
3. Faça login
4. Aceite as permissões de push quando solicitado
5. Verifique o console para logs:
   ```
   ✅ OneSignal initialized successfully
   📱 Player ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ✅ OneSignal External User ID set: [user-id]
   ```
6. Confirme no banco:
   ```sql
   SELECT onesignal_player_id FROM profiles WHERE id = 'user-id';
   ```

### **Teste 4: Enviar Notificação Real**
Após ter pelo menos 1 usuário com Player ID:

```javascript
// Via Supabase client
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    title: 'Bem-vindo ao Shape Pro! 🎉',
    message: 'Sua notificação está funcionando perfeitamente!',
    target_users: ['user-id-com-player-id']
  }
});

// Resposta esperada:
// { notificationId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

---

## 🔧 Troubleshooting

### Problema: "No player IDs found"
**Causa:** Usuário não aceitou permissões ou OneSignal não inicializou  
**Solução:**
1. Verificar se `VITE_ONESIGNAL_APP_ID` está no `.env`
2. Abrir app em dispositivo real
3. Aceitar permissões quando solicitado
4. Verificar console para erros do OneSignal

### Problema: "Missing OneSignal API credentials"
**Causa:** Secrets não configurados no Supabase  
**Solução:**
1. Obter REST API Key do OneSignal
2. Adicionar `ONESIGNAL_API_KEY` no Supabase Vault
3. Reiniciar edge function (deploy automático)

### Problema: Player ID não salva no banco
**Causa:** RLS policies ou erro na função `updatePlayerIdInSupabase`  
**Solução:**
1. Verificar RLS da tabela `profiles`:
   ```sql
   -- Deve permitir UPDATE do próprio perfil
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
2. Verificar logs do console para erros
3. Tentar atualizar manualmente:
   ```sql
   UPDATE profiles 
   SET onesignal_player_id = 'test-player-id' 
   WHERE id = auth.uid();
   ```

### Problema: Notificação não chega no dispositivo
**Checklist:**
- [ ] Player ID está salvo no banco?
- [ ] Usuário aceitou permissões?
- [ ] App está em segundo plano? (notificações só aparecem quando app não está em foco)
- [ ] REST API Key está correto?
- [ ] Edge function retornou sucesso (200)?
- [ ] Verificar logs do OneSignal Dashboard

---

## 📱 Fluxo Completo

### **Para WEB:**
```mermaid
graph TD
    A[Usuário faz login] --> B[AuthProvider.tsx detecta user]
    B --> C[initWebPush é chamado]
    C --> D[OneSignal SDK carrega]
    D --> E{Permissão já concedida?}
    E -->|Não| F[Solicitar permissão]
    E -->|Sim| G[Obter Player ID]
    F --> G
    G --> H[updatePlayerIdInSupabase]
    H --> I[Player ID salvo na tabela profiles]
    I --> J[Pronto para receber notificações]
```

### **Para MOBILE (Android/iOS):**
```mermaid
graph TD
    A[Usuário faz login] --> B[AuthProvider.tsx detecta user]
    B --> C[initMobilePush é chamado]
    C --> D[OneSignal Cordova Plugin inicializa]
    D --> E{Permissão já concedida?}
    E -->|Não| F[Prompt nativo do OS]
    E -->|Sim| G[Obter Device State]
    F --> G
    G --> H[updatePlayerIdInSupabase]
    H --> I[Player ID salvo na tabela profiles]
    I --> J[Pronto para receber notificações]
```

---

## 🎯 Checklist de Deploy (BUILD 28)

### **Antes de ir para produção:**

#### Backend (Supabase)
- [ ] `ONESIGNAL_API_KEY` configurado no Vault
- [ ] `ONESIGNAL_APP_ID` configurado no Vault
- [ ] Edge function `send-push-notification` deployada
- [ ] Tabela `profiles` tem coluna `onesignal_player_id`
- [ ] Tabela `notification_logs` existe
- [ ] RLS policies permitem updates de Player ID

#### Frontend (Web)
- [ ] `VITE_ONESIGNAL_APP_ID` no `.env`
- [ ] Service Worker `OneSignalSDKWorker.js` no `/public`
- [ ] `initWebPush` é chamado no `AuthProvider`
- [ ] Logs do console confirmam inicialização

#### Mobile (Android/iOS)
- [ ] `onesignal-cordova-plugin` instalado
- [ ] `ONESIGNAL_APP_ID` no `capacitor.config.json`
- [ ] `initMobilePush` é chamado no `AuthProvider`
- [ ] Service Worker no `/android/app/src/main/assets/public`
- [ ] Build gradle tem dependência OneSignal

#### Testes Finais
- [ ] Pelo menos 1 usuário teste tem Player ID no banco
- [ ] Notificação de teste foi enviada e recebida
- [ ] Notificação aparece quando app está em background
- [ ] Deep link funciona (se aplicável)
- [ ] Logs do OneSignal Dashboard mostram entregas

---

## 🚀 Próximos Passos (Pós BUILD 28)

1. **Segmentação Avançada:**
   - Adicionar tags (`user_type`, `subscription_plan`, etc.)
   - Criar segmentos no OneSignal Dashboard
   
2. **Notificações Programadas:**
   - Implementar `send_after` na edge function
   - Criar sistema de lembretes automáticos

3. **Rich Media:**
   - Suporte para imagens em notificações
   - Action buttons customizados

4. **Analytics:**
   - Dashboard de entregas/aberturas
   - A/B testing de mensagens

---

## 📚 Links Úteis

- **OneSignal Dashboard:** https://dashboard.onesignal.com/apps/be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82
- **Supabase Project:** https://supabase.com/dashboard/project/bqbopkqzkavhmenjlhab
- **Documentação OneSignal (Web):** https://documentation.onesignal.com/docs/web-push-quickstart
- **Documentação OneSignal (Cordova):** https://documentation.onesignal.com/docs/cordova-sdk-setup
- **API Reference:** https://documentation.onesignal.com/reference/create-notification
