# 📋 CHANGELOG - Shape Pro App

Histórico de todas as mudanças significativas no projeto.

---

## BUILD 38 (2025-01-29)

### ✅ AI Assistant Reativado
- **Secrets OpenAI configuradas**: Sistema pronto com OPENAI_API_KEY e OPENAI_ASSISTANT_ID
- **Edge Function validada**: ai-assistant funciona com contexto completo do aluno
- **Respostas personalizadas**: AI usa nome, treinos, objetivos, anamnese e histórico do aluno

### 🎨 Melhorias UX
- **Nome do usuário no header**: "Olá, {Nome}! 👋" no topo do chat
- **Mensagem inicial personalizada**: Indica que AI já conhece o contexto do aluno
- **Coach IA exclusivo no Dashboard**: Removido da bottom navigation, acessível apenas via card

### 🔧 Correções Técnicas
- Removido tab "assistant" do BottomNavigation
- Removido case 'assistant' do Index.tsx
- Removido import de AIAssistant (não usado via Index)
- AIChat.tsx integrado com useAuthContext para personalização

### 📊 Contexto Histórico
- Sistema já foi usado em agosto/setembro 2025
- 5+ conversas anteriores validadas no banco
- AI demonstrou conhecimento de diabetes, alergias e treinos específicos

---

## BUILD 37 (2025-01-29)

### ✅ Correções Críticas
- **AI Chat funcional**: Separado chat AI (useAIConversation) de chat professor-aluno (useConversation)
- **Teclado não empurra mais a barra**: useKeyboardState integrado no AIChat.tsx
- **Logo Android documentado**: Criado guia completo em docs/ANDROID_ICON_GUIDE.md

### 🔧 Mudanças Técnicas
- **Renomeado arquivos:**
  - `Chat.tsx` → `TeacherStudentChat.tsx`
  - `LazyChat.tsx` → `LazyTeacherStudentChat.tsx`
- **Criados arquivos:**
  - `src/pages/AIChat.tsx` - Chat AI usando useAIConversation
  - `src/pages/lazy/LazyAIChat.tsx` - Lazy loading do AI Chat
  - `docs/ANDROID_ICON_GUIDE.md` - Guia de ícones Android
- **Atualizadas rotas:**
  - `/chat` → AI Chat (aluno conversando com AI)
  - `/teacher-chat` → Chat Professor-Aluno
- **BottomNavigation atualizado:**
  - Tab "Coach IA" agora aponta para `/chat` (AI Chat)

### 🎨 Melhorias de UX
- Input de mensagem agora posiciona acima do teclado mobile
- BottomNavigation esconde automaticamente quando teclado aparece
- Transições suaves (200ms) em todas as mudanças de layout
- Logo Shape Pro no header do AI Chat

### 📱 Mobile (Android)
- Documentação completa para atualizar ícones do app
- Instruções para gerar 5 resoluções (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Safe zone e especificações de design incluídas

### 🔄 Arquitetura
```
Chat AI (aluno ↔ AI)          Chat Professor-Aluno
├── /chat                     ├── /teacher-chat
├── AIChat.tsx                ├── TeacherStudentChat.tsx
├── useAIConversation         ├── useConversation
└── Edge Function:            └── Supabase Realtime
    ai-assistant
```

---

## BUILD 36 (2025-01-XX)

### ✅ Limpeza de Debug
- **Removido NotificationDebug.tsx**: Sistema de debug removido (produção)
- **Atualizado ONESIGNAL_ARCHITECTURE.md**: Documentação atualizada com instruções de teste
- **Corrigido console.log**: NotificationManager agora usa logger.error

### 🔧 Sistema de Notificações (Produção)
- **NotificationManager**: Professor envia via Dashboard
- **NotificationCenter**: Aluno visualiza no sino (header)
- **OneSignal**: Push notifications funcionais
- **Edge Function**: send-push-notification processando envios

### 📚 Documentação
- Seção "Debug Tools Removidos" adicionada
- Instruções de teste via Dashboard Professor
- Como verificar OneSignal funcionando (Dashboard + Supabase)

---

## BUILD 35 (Anterior)

### ✅ OneSignal Implementado
- Integração completa com OneSignal
- Push notifications web + mobile
- Player ID tracking no perfil do usuário
- NotificationDebug para desenvolvimento

---

## 🎯 Próximos Builds

### BUILD 39 (Planejado)
- [ ] Melhorar streaming de respostas AI (token-by-token)
- [ ] Adicionar histórico de conversas AI
- [ ] Implementar sugestões rápidas no AI Chat

---

## 📊 Estatísticas Gerais

| Build | Linhas Adicionadas | Linhas Removidas | Arquivos Modificados |
|-------|-------------------|------------------|---------------------|
| 37 | ~350 | ~50 | 8 |
| 36 | ~100 | ~300 | 4 |
| 35 | ~500 | ~20 | 10 |

---

## 🔗 Links Úteis

- [Documentação OneSignal](./ONESIGNAL_ARCHITECTURE.md)
- [Guia Ícones Android](./ANDROID_ICON_GUIDE.md)
- [Arquitetura Geral](./README.md)

---

**Última atualização:** BUILD 38 (2025-01-29)
