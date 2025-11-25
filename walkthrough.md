# Relatório de Atualizações e Correções - Shape Pro (v4.0.1 Build 56)

## 1. Correção Crítica de Registro
**Problema:** Usuários novos não conseguiam se cadastrar devido a um erro de banco de dados ("Database error saving new user").
**Causa:** A função `handle_new_user` foi removida na última migração, e a lógica anterior tentava inserir um `teacher_id` inválido ou hardcoded.
**Solução:**
- Criado script SQL `fix_registration_error.sql` que recria a função `handle_new_user`.
- A nova função busca dinamicamente um professor válido (`user_type = 'teacher'`) para associar ao aluno, evitando erros de chave estrangeira.
- **Ação Necessária:** Execute o arquivo `fix_registration_error.sql` no Editor SQL do Supabase.

## 2. Interface do Chat (Professor & IA)
**Problema:**
- Barra inferior subia junto com o teclado ou conteúdo.
- Campo de entrada de texto ficava escondido atrás da barra inferior.
- Design do Assistente IA estava básico.

**Soluções:**
- **TeacherStudentChat.tsx:**
  - `BottomNavigation` movido para fora do `MobileContainer` para garantir posicionamento fixo correto.
  - Campo de entrada agora calcula dinamicamente sua posição baseada na altura do teclado e safe-area do dispositivo.
- **AIChat.tsx (Redesign):**
  - Nova interface moderna estilo "WhatsApp/ChatGPT".
  - Cabeçalho simplificado e elegante.
  - Sugestões de perguntas rápidas no estado vazio (ex: "Criar treino de hipertrofia").
  - Balões de mensagem com design diferenciado para usuário e IA.
  - Tratamento correto de Safe Area e Teclado.

## 3. Links de Termos e Privacidade
**Problema:** Links abriam na mesma janela, quebrando o fluxo do app nativo.
**Solução:** Substituídos por chamadas `Browser.open` do Capacitor, garantindo que abram no navegador do sistema sem fechar o app.

## 4. Versão do App
- Atualizado **Android** (`build.gradle`) para `versionCode 56`.
- Atualizado **iOS** (`Info.plist`) para `CFBundleVersion 56`.
- Versão mantida em `4.0.1`.

## 5. Revisões de Lógica
- **Permissões:** Verificado `NotificationPermissionModal`. A lógica de integração com OneSignal está correta e robusta.
- **Gamificação:** Verificado `GamificationProvider` e `Rewards`. A lógica de pontos e resgate está implementada corretamente (resgate via RPC no servidor).

---

## Próximos Passos para o Desenvolvedor
1. **Executar SQL:** Rode o script `fix_registration_error.sql` no Supabase.
2. **Build Nativo:**
   - Execute `npx cap sync` para sincronizar as mudanças de versão.
   - Gere novos builds para Android e iOS.
3. **Testar:**
   - Criar um novo usuário para validar o registro.
   - Testar o Chat com o teclado aberto para verificar o layout.
