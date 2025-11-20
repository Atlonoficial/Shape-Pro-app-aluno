# Teacher Presence System - Checklist de Verificação

Este documento fornece um checklist completo para verificar e implementar o sistema de presença do professor no Dashboard Externo, garantindo que o status "online" seja exibido corretamente no Student App.

---

## ⚠️ PROBLEMA ATUAL: PROFESSOR NÃO APARECE ONLINE

### Diagnóstico Rápido

Se o professor não aparece online no Student App, siga estes passos na Dashboard Externa:

#### 1. ✅ Verificar conversationId

```typescript
// Na Dashboard, adicione este log temporário:
console.log('ConversationId:', conversationId);
// Deve ser exatamente no formato: {teacher_id}-{student_id}
// Exemplo: 2db424b4-08d2-4ad0-9dd0-971eaab960e1-1adbd8ee-fc70-46d4-9187-ad69b523eb11
```

#### 2. ✅ Verificar canal conectado

```typescript
// Verifique o nome do canal:
console.log('Channel:', channel.topic);
// Deve mostrar: presence:{teacher_id}-{student_id}
```

#### 3. ✅ Verificar presenceState

```typescript
channel.on('presence', { event: 'sync' }, () => {
  console.log('Presence State:', channel.presenceState());
  // Deve mostrar objeto com teacher_id E student_id como chaves
  // Se estiver vazio, a Dashboard não está conectada corretamente
});
```

#### 4. ✅ Verificar heartbeat

```typescript
// Deve aparecer a cada 15 segundos no console:
console.log('💓 Sending heartbeat');
// Se não aparecer, o heartbeat não está configurado
```

---

## 💡 SOLUÇÃO COMPLETA PARA DASHBOARD EXTERNA

### Passo 1: Criar o Hook useTeacherPresence

Copie este hook **exatamente como está** para a Dashboard:

```typescript
// hooks/useTeacherPresence.ts (Dashboard Externa)
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTeacherPresence = (conversationId: string, teacherId: string) => {
  const [isActive, setIsActive] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();

  const sendHeartbeat = useCallback(() => {
    if (!channelRef.current || !teacherId) return;

    channelRef.current.track({
      user_id: teacherId,
      online_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      typing: false
    });
  }, [teacherId]);

  useEffect(() => {
    if (!conversationId || !teacherId) {
      console.warn('⚠️ useTeacherPresence: Missing conversationId or teacherId');
      return;
    }

    console.log('🔌 Connecting to presence channel:', `presence:${conversationId}`);

    const channel = supabase
      .channel(`presence:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('🟢 Teacher Presence State:', state);
      })
      .subscribe(async (status) => {
        console.log('📡 Subscription Status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsActive(true);
          
          const initialPresence = {
            user_id: teacherId,
            online_at: new Date().toISOString(),
            last_heartbeat: new Date().toISOString(),
            typing: false
          };

          console.log('✅ Sending initial teacher presence:', initialPresence);
          await channel.track(initialPresence);

          // Heartbeat a cada 15 segundos
          heartbeatRef.current = setInterval(() => {
            console.log('💓 Sending heartbeat');
            sendHeartbeat();
          }, 15000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Disconnecting from presence channel');
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      supabase.removeChannel(channel);
      setIsActive(false);
    };
  }, [conversationId, teacherId, sendHeartbeat]);

  return { isActive };
};
```

### Passo 2: Usar no Componente de Chat

Ative a presença quando uma conversa for selecionada:

```typescript
// pages/TeacherChat.tsx (Dashboard Externa)
import { useTeacherPresence } from '@/hooks/useTeacherPresence';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function TeacherChat() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const { user } = useAuth();
  
  // ✅ ATIVAR PRESENÇA quando conversa estiver selecionada
  const { isActive } = useTeacherPresence(
    selectedConversation?.id || '', 
    user?.id || ''
  );

  return (
    <div>
      {/* Indicador visual opcional */}
      {isActive && selectedConversation && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          Você está online para este aluno
        </div>
      )}
      
      {/* Resto do componente de chat */}
    </div>
  );
}
```

---

## 🧪 COMO TESTAR SE FUNCIONOU

### No Student App (console do navegador)

Você deve ver este log quando o professor conectar:

```
🔍 [EnhancedPresence] Presence Sync: {
  channelName: "presence:{conversationId}",
  onlineUsers: ["teacher_id"],  // ✅ ID do professor aparece aqui!
  typingUsers: [],
  totalPresences: 2  // ✅ 2 usuários (aluno + professor)
}
```

### No ChatHeader do Student App

Você deve ver:
- ✅ Badge verde pulsante
- ✅ Texto "online" ao lado do nome do professor
- ✅ Badge desaparece se professor fechar Dashboard ou ficar inativo por 30 segundos

### Na Dashboard Externa (console)

Você deve ver estes logs:

```
🔌 Connecting to presence channel: presence:{conversationId}
📡 Subscription Status: SUBSCRIBED
✅ Sending initial teacher presence: { user_id: "...", ... }
💓 Sending heartbeat  // ← A cada 15 segundos
🟢 Teacher Presence State: { ... }  // ← Mostra professor e aluno
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Na Dashboard Externa

- [ ] Criar arquivo `hooks/useTeacherPresence.ts` com o código fornecido
- [ ] Importar hook no componente de chat
- [ ] Passar `conversationId` e `teacherId` corretos
- [ ] Ativar apenas quando conversa estiver selecionada
- [ ] Verificar logs no console (conexão, heartbeats)

### No Student App

- [ ] Verificar que não há erros no console
- [ ] Confirmar que badge "online" aparece quando professor conecta
- [ ] Testar que badge desaparece quando professor desconecta
- [ ] Verificar que mensagens chegam em tempo real

---

## 🔧 TROUBLESHOOTING

### Problema: Professor não aparece online

**Possível causa 1**: conversationId diferente entre apps
```typescript
// Verificar se são IDÊNTICOS:
console.log('Dashboard:', conversationId);
console.log('Student App:', conversation?.id);
```

**Possível causa 2**: Canal com nome errado
```typescript
// Deve ser EXATAMENTE:
`presence:${conversationId}`
// NÃO usar variações
```

**Possível causa 3**: Heartbeat não está sendo enviado
```typescript
// Verificar se aparece a cada 15 segundos:
console.log('💓 Sending heartbeat');
```

**Possível causa 4**: last_heartbeat faltando no track()
```typescript
// OBRIGATÓRIO incluir:
channel.track({
  user_id: teacherId,
  online_at: new Date().toISOString(),
  last_heartbeat: new Date().toISOString(),  // ← CRÍTICO
  typing: false
});
```

---

## 📊 ESTRUTURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE REALTIME                        │
│              Channel: presence:{conversationId}              │
└─────────────────────────────────────────────────────────────┘
                ▲                           ▲
                │                           │
        track() │                           │ track()
     heartbeat  │                           │ heartbeat
       (15s)    │                           │  (15s)
                │                           │
     ┌──────────┴─────────┐      ┌──────────┴─────────┐
     │   STUDENT APP      │      │  TEACHER DASHBOARD │
     │                    │      │                    │
     │ useEnhancedPresence│      │ useTeacherPresence │
     │                    │      │                    │
     │ Listen: sync/join/ │      │ Listen: sync/join/ │
     │         leave      │      │         leave      │
     │                    │      │                    │
     │ Show: Teacher      │      │ Show: Student      │
     │       online badge │      │       online badge │
     └────────────────────┘      └────────────────────┘
```

---
- ❌ `presence-${conversationId}` (sem dois pontos)
- ❌ `presence:teacher:${conversationId}`

### Como Verificar
```typescript
// Na Dashboard:
console.log('📡 Channel Name:', channel.topic);

// Deve mostrar exatamente:
// presence:{conversationId}
```

---

## 3. ✅ Verificar Formato do track()

### Payload EXATO Obrigatório
```typescript
await channel.track({
  user_id: teacherId,              // ✅ UUID do professor
  online_at: new Date().toISOString(),
  last_heartbeat: new Date().toISOString(), // ✅ OBRIGATÓRIO!
  typing: false
});
```

### ⚠️ Campos OBRIGATÓRIOS
- `user_id`: UUID do professor (string)
- `last_heartbeat`: ISO timestamp atual (string)
- `online_at`: ISO timestamp inicial (string)
- `typing`: boolean

### Exemplo Completo
```typescript
{
  user_id: "2db424b4-08d2-4ad0-9dd0-971eaab960e1",
  online_at: "2025-11-20T21:15:00.000Z",
  last_heartbeat: "2025-11-20T21:15:00.000Z",
  typing: false
}
```

### ⚠️ Erros Comuns
- ❌ Falta `last_heartbeat` (campo crítico!)
- ❌ `user_id` incorreto ou nulo
- ❌ Timestamps não atualizados

---

## 4. ✅ Verificar Heartbeat

### Implementação Correta
```typescript
// Intervalo de 15 segundos
const heartbeatInterval = setInterval(() => {
  channel.track({
    user_id: teacherId,
    online_at: new Date().toISOString(),
    last_heartbeat: new Date().toISOString(), // Atualizar sempre!
    typing: false
  });
  console.log('💓 Heartbeat enviado');
}, 15000);

// Limpeza obrigatória
return () => clearInterval(heartbeatInterval);
```

### Checklist Heartbeat
- [ ] Intervalo configurado para 15 segundos (15000ms)
- [ ] `setInterval` armazenado em referência
- [ ] Cleanup no `useEffect` return
- [ ] `last_heartbeat` atualizado a cada envio
- [ ] Logs confirmando envio periódico

### Como Verificar
```typescript
// Console da Dashboard deve mostrar a cada 15 segundos:
// 💓 Heartbeat enviado
```

---

## 5. ✅ Testar Conexão com Console Logs

### Logs Essenciais na Dashboard

```typescript
// Ao conectar:
console.log('🟢 Teacher Presence Activating:', {
  conversationId,
  teacherId,
  channelName: `presence:${conversationId}`
});

// No evento sync:
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  console.log('🔄 Presence State:', state);
  console.log('👥 Total presences:', Object.values(state).flat().length);
});

// Ao enviar track:
console.log('✅ Sending presence:', {
  user_id: teacherId,
  last_heartbeat: new Date().toISOString()
});

// A cada heartbeat:
console.log('💓 Heartbeat sent at:', new Date().toISOString());
```

### Verificação de Sucesso
```
✅ Console deve mostrar:
1. 🟢 Teacher Presence Activating
2. ✅ Sending presence
3. 🔄 Presence State (com 2+ presences)
4. 💓 Heartbeat sent (a cada 15 segundos)
```

---

## 6. ✅ Código Completo de Referência

### Hook useTeacherPresence.ts
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTeacherPresence = (conversationId: string, teacherId: string) => {
  const [isActive, setIsActive] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();

  const sendHeartbeat = useCallback(() => {
    if (!channelRef.current || !teacherId) return;

    channelRef.current.track({
      user_id: teacherId,
      online_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      typing: false
    });

    console.log('💓 Heartbeat sent');
  }, [teacherId]);

  useEffect(() => {
    if (!conversationId || !teacherId) {
      console.warn('⚠️ Missing conversationId or teacherId');
      return;
    }

    const channelName = `presence:${conversationId}`;
    console.log('🔌 Connecting to:', channelName);

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('🔄 Presence State:', state);
      })
      .subscribe(async (status) => {
        console.log('📡 Subscription Status:', status);

        if (status === 'SUBSCRIBED') {
          setIsActive(true);

          // Presença inicial
          await channel.track({
            user_id: teacherId,
            online_at: new Date().toISOString(),
            last_heartbeat: new Date().toISOString(),
            typing: false
          });

          console.log('✅ Teacher presence sent');

          // Heartbeat a cada 15 segundos
          heartbeatRef.current = setInterval(sendHeartbeat, 15000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Disconnecting');
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      supabase.removeChannel(channel);
      setIsActive(false);
    };
  }, [conversationId, teacherId, sendHeartbeat]);

  return { isActive };
};
```

### Uso na TeacherChat.tsx
```typescript
import { useTeacherPresence } from '@/hooks/useTeacherPresence';

export default function TeacherChat() {
  const { teacherId } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);

  // ✅ Ativar presença quando conversa estiver selecionada
  const { isActive } = useTeacherPresence(
    selectedConversation?.id || '',
    teacherId || ''
  );

  return (
    <div>
      {isActive && (
        <div className="text-xs text-success flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Você está online para este aluno
        </div>
      )}
      {/* Chat interface */}
    </div>
  );
}
```

---

## 7. 🧪 Testes de Integração

### Teste 1: Verificar IDs Idênticos
```typescript
// Student App (console)
console.log('Student Conversation:', conversation?.id);

// Dashboard (console)
console.log('Dashboard Conversation:', conversationId);

// ✅ Devem ser IDÊNTICOS
```

### Teste 2: Verificar Canal Conectado
```typescript
// Student App
console.log('Student Channel:', channel.topic);
// Deve mostrar: presence:{conversationId}

// Dashboard
console.log('Dashboard Channel:', channel.topic);
// Deve mostrar: presence:{conversationId}

// ✅ Devem ser IDÊNTICOS
```

### Teste 3: Verificar presenceState()
```typescript
// Na Dashboard, após conectar:
const state = channel.presenceState();
console.log('Presence State:', state);

// ✅ Deve mostrar objeto com 2+ usuários
// ❌ Se vazio, Dashboard não está conectada
```

### Teste 4: Simular Heartbeat
```typescript
// Dashboard: verificar logs a cada 15 segundos
// 💓 Heartbeat sent

// Student App: deve detectar professor em 2-3 segundos
// 🟢 Badge "online" deve aparecer
```

---

## 8. 🚨 Diagnóstico de Problemas

### Problema: Professor não aparece online

#### Possível Causa 1: conversationId diferente
```typescript
// Solução: Comparar IDs
console.log('Student:', conversation?.id);
console.log('Dashboard:', conversationId);
// Devem ser iguais!
```

#### Possível Causa 2: Canal incorreto
```typescript
// Verificar se ambos usam:
// presence:${conversationId}
console.log('Channel:', channel.topic);
```

#### Possível Causa 3: track() sem last_heartbeat
```typescript
// ERRADO ❌
channel.track({ user_id: teacherId });

// CORRETO ✅
channel.track({
  user_id: teacherId,
  last_heartbeat: new Date().toISOString()
});
```

#### Possível Causa 4: Heartbeat não enviado
```typescript
// Verificar se está enviando a cada 15 segundos
// Console deve mostrar: 💓 Heartbeat sent
```

---

## 9. ✅ Checklist Final de Implementação

### Dashboard Externa
- [ ] Hook `useTeacherPresence` criado
- [ ] Hook chamado com `conversationId` correto
- [ ] Canal: `presence:${conversationId}`
- [ ] `track()` com todos os campos obrigatórios
- [ ] `last_heartbeat` presente e atualizado
- [ ] Heartbeat a cada 15 segundos com `setInterval`
- [ ] Cleanup do interval no `useEffect` return
- [ ] Logs de debug adicionados
- [ ] Presença ativada quando conversa selecionada

### Student App
- [ ] Debug panel ativado (desenvolvimento)
- [ ] Logs mostrando presences detectadas
- [ ] Badge "online" aparecendo quando professor conecta
- [ ] Badge desaparece após 30 segundos sem heartbeat

---

## 10. 📊 Fluxo Esperado

```
1. Professor abre Dashboard
   ↓
2. Seleciona conversa com aluno
   ↓
3. useTeacherPresence conecta ao canal presence:${conversationId}
   ↓
4. Envia presença inicial (track)
   ↓
5. Inicia heartbeat a cada 15 segundos
   ↓
6. Student App detecta presença em 2-3 segundos
   ↓
7. Badge "online" aparece no chat
   ↓
8. Professor fecha Dashboard
   ↓
9. Heartbeat para de ser enviado
   ↓
10. Após 30 segundos, Student App marca como "offline"
```

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir, verifique:

1. ✅ Console do Student App mostra presences?
2. ✅ Console da Dashboard mostra heartbeats?
3. ✅ IDs são idênticos?
4. ✅ Nomes dos canais são idênticos?
5. ✅ `last_heartbeat` está sendo atualizado?

Se todas as respostas forem "sim" e ainda não funcionar, o problema pode estar na configuração do Supabase Realtime ou permissões RLS.
