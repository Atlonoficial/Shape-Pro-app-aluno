# 🏗️ Arquitetura OneSignal - Shape Pro

## 📐 Design Atual (BUILD 36)

### Arquivos Principais:
1. **src/lib/push.ts** - Core do OneSignal (web + mobile)
2. **src/components/auth/AuthProvider.tsx** - Inicialização automática
3. **src/components/notifications/NotificationCenter.tsx** - Centro de notificações (sino no header)
4. **src/components/teacher/NotificationManager.tsx** - Envio de notificações (Dashboard Professor)
5. **supabase/functions/send-push-notification/index.ts** - Edge Function

### Fluxo de Inicialização:
```
Login → AuthProvider (linha 105) → initPush() → 
  ↓
isMobileApp() → initMobilePush() ou initWebPush()
  ↓
OneSignal SDK carrega → solicita permissão → 
  ↓
Captura Player ID → updatePlayerIdInSupabase()
  ↓
Salva em profiles.onesignal_player_id
```

### Diferenças do Documento APP_ALUNO_ONESIGNAL_SETUP.md:
- ❌ NÃO usa `useOneSignal` hook (mais simples)
- ❌ NÃO usa `OneSignalInitializer` component (integrado no AuthProvider)
- ✅ Usa `src/lib/push.ts` diretamente (menos arquivos)
- ✅ Inicialização automática no login (sem botões manuais)

### Por que esta arquitetura?
- ✅ Menos código para manter
- ✅ Integração transparente para o usuário
- ✅ Funciona em web + mobile sem mudanças
- ✅ Já testado e funcionando
- ✅ Sem componentes extras desnecessários

## 🗑️ Debug Tools Removidos (BUILD 36)

### NotificationDebug.tsx (REMOVIDO)
- **Motivo:** Ferramenta apenas para desenvolvimento
- **Substituição:** Use o Dashboard Professor para enviar notificações de teste
- **Como testar:**
  1. Faça login como professor
  2. Acesse Dashboard Professor
  3. Use o NotificationManager para enviar notificações
  4. Verifique no OneSignal Dashboard se foram enviadas

## 🧪 Como Verificar se OneSignal Está Funcionando

### 1. No OneSignal Dashboard
- Acesse: https://app.onesignal.com
- Veja quantos usuários têm Player IDs registrados
- Veja histórico de notificações enviadas

### 2. No Supabase (tabela profiles)
```sql
SELECT COUNT(*) FROM profiles WHERE onesignal_player_id IS NOT NULL;
```

### 3. No Supabase (tabela notification_logs)
```sql
SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10;
```

### 4. Testando o Fluxo Completo
1. Login como professor no Dashboard Professor
2. Use o NotificationManager para enviar uma notificação
3. Login como aluno
4. Verifique o sino (NotificationCenter) no header
5. A notificação deve aparecer na lista

## 🔍 Detalhes Técnicos

### src/lib/push.ts
**Responsabilidades:**
- Detectar plataforma (web vs mobile)
- Inicializar SDK correto
- Solicitar permissões
- Capturar Player ID
- Atualizar Supabase
- Gerenciar eventos de notificações

**Funções principais:**
```typescript
initPush(externalUserId?: string)          // Entry point
initWebPush(APP_ID, externalUserId)        // Web initialization
initMobilePush(APP_ID, externalUserId)     // Mobile initialization
updatePlayerIdInSupabase(playerId, userId) // Save to DB
enablePush() / disablePush()               // User controls
```

### AuthProvider.tsx (linha 105)
**Código de inicialização:**
```typescript
if (user?.id) {
  logger.info('AuthProvider', 'Initializing OneSignal', { userId: user.id });
  initPush(user.id).catch((error) => {
    logger.error('AuthProvider', 'OneSignal init failed', error);
  });
}
```

**Por que no AuthProvider?**
- Garante que OneSignal inicializa apenas quando usuário está autenticado
- External User ID é setado automaticamente
- Player ID é associado ao perfil correto
- Sem necessidade de hook separado

### send-push-notification Edge Function
**Endpoint:** `/functions/v1/send-push-notification`

**Payload:**
```json
{
  "title": "Título da notificação",
  "message": "Mensagem da notificação",
  "target_users": ["user-id-1", "user-id-2"],
  "deep_link": "/workout/123" (opcional),
  "big_picture": "https://..." (opcional)
}
```

**O que faz:**
1. Busca Player IDs dos usuários alvo no banco
2. Monta payload do OneSignal
3. Envia via OneSignal REST API
4. Loga resultado em `notification_logs`

## 🔄 Comparação com Arquitetura Alternativa

### Arquitetura Atual (Simples)
```
AuthProvider → initPush() → OneSignal SDK → updatePlayerIdInSupabase()
```
**Prós:**
- ✅ Menos arquivos (1 lib + 1 provider)
- ✅ Inicialização automática
- ✅ Menos pontos de falha
- ✅ Mais fácil debugar

**Contras:**
- ⚠️ Menos modular (tudo em push.ts)

### Arquitetura com Hooks (Complexa)
```
AuthProvider → OneSignalInitializer → useOneSignal() → updatePlayerIdInSupabase()
```
**Prós:**
- ✅ Mais modular
- ✅ Hook pode ser usado em múltiplos lugares

**Contras:**
- ❌ Mais arquivos para manter
- ❌ Mais complexo
- ❌ Desnecessário para este caso de uso

## 🎯 Conclusão

A arquitetura atual foi escolhida por **simplicidade e eficiência**. Como OneSignal só precisa ser inicializado uma vez no login, não há necessidade de hooks ou componentes separados. O código é mais direto, fácil de entender e manter.

**Quando considerar refatorar:**
- Se precisar usar OneSignal em múltiplos pontos da aplicação
- Se adicionar lógica complexa de segmentação
- Se precisar gerenciar estado global de notificações
