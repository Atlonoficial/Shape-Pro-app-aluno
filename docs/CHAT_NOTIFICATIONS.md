# 📬 Sistema de Notificações de Chat

## Como Funciona

### Criação de Notificações
- **Trigger**: `on_chat_message_insert` no banco de dados
- **Quando**: Ao inserir nova mensagem em `chat_messages`
- **O que**: Cria notificação na tabela `notifications` para o destinatário
- **Tipo**: `'message'` com deep_link para `/teacher-chat`

### Auto-Delete de Notificações
- **Função**: `delete_chat_notifications(user_id, conversation_id)`
- **Quando**: Ao abrir página `/teacher-chat`
- **O que**: Deleta todas as notificações tipo `'message'` da conversa atual

### Fluxo Completo

1. **Professor envia mensagem**
   - INSERT em `chat_messages`
   - Trigger cria notificação para aluno
   - Notificação aparece no sino (NotificationCenter)

2. **Aluno vê notificação**
   - Badge vermelho com contador de não lidas
   - Ao clicar, navega para `/teacher-chat`

3. **Aluno entra no chat**
   - `useEffect` detecta entrada
   - Chama `delete_chat_notifications`
   - Notificações são removidas automaticamente
   - Badge desaparece

### Performance

- ✅ Trigger no BD = 0 sobrecarga na aplicação
- ✅ Auto-delete instantâneo ao entrar no chat
- ✅ Realtime já consolidado em `useGlobalRealtime`
- ✅ 1 query para deletar todas as notificações da conversa

### Testes

#### Cenário 1: Professor → Aluno
```
1. Professor envia "Olá, como está?"
2. Aluno vê sino com badge "1"
3. Aluno abre NotificationCenter
4. Vê "Nova mensagem de Prof. João"
5. Clica na notificação
6. Abre /teacher-chat
7. Notificação desaparece automaticamente
8. Badge volta a "0"
```

#### Cenário 2: Aluno já no chat
```
1. Aluno está em /teacher-chat
2. Professor envia mensagem
3. Notificação é criada
4. Mas é DELETADA instantaneamente (useEffect)
5. Aluno vê mensagem no chat sem notificação no sino
```

## Implementação Técnica

### Database Trigger
```sql
CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notification();
```

### Auto-delete no Frontend
```typescript
useEffect(() => {
  if (conversation?.id && user?.id) {
    const deleteNotifications = async () => {
      const { error } = await supabase.rpc('delete_chat_notifications', {
        p_user_id: user.id,
        p_conversation_id: conversation.id
      });
    };
    deleteNotifications();
  }
}, [conversation?.id, user?.id]);
```

## Benefícios

- **🚀 Performance**: Trigger no banco = zero overhead na aplicação
- **✨ UX**: Notificações aparecem instantaneamente
- **🧹 Limpeza**: Auto-delete ao entrar no chat
- **📱 Mobile-ready**: Preparado para push notifications futuras
