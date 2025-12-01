# Auditoria de Conformidade Apple App Store (Guideline 3.1.1)

**Data:** 30/11/2025
**Status:** Crítico (Rejeição Ativa)
**Analista:** Antigravity (Engenheiro iOS Sênior)

---

## 1. Auditoria da Guideline 3.1.1 (Business - In-App Purchase)

A rejeição ocorre porque a Apple detectou fluxos que direcionam o usuário para mecanismos de pagamento fora do aplicativo (WhatsApp, Links Externos) para desbloquear funcionalidades digitais (Planos de Treino/Dieta).

### 🚨 Violações Identificadas

#### A. O "Botão do WhatsApp" com Intenção de Compra
**Arquivo:** `src/components/auth/SubscriptionGuard.tsx`
**Trecho Problemático:**
```typescript
const message = status === 'expired'
    ? 'Olá, meu plano expirou. Gostaria de renovar!' // <--- VIOLAÇÃO CLARA
    : 'Olá, gostaria de solicitar meu plano de treino.';

const whatsappUrl = `https://wa.me/${teacherPhone...}`;
```
**Por que viola:** A mensagem pré-definida "Gostaria de renovar" sinaliza explicitamente para o revisor da Apple que o botão serve para realizar uma transação comercial (renovação) fora do app. Mesmo que a transação ocorra no WhatsApp, o *link* dentro do app facilita isso, o que é proibido para bens digitais sem IAP.

#### B. Call-to-Action em "Assinaturas e Planos"
**Arquivo:** `src/pages/AssinaturasPlanos.tsx`
**Trecho Problemático:**
Botão "Falar com o Treinador" em um contexto de "Meu Acesso" ou "Assinatura".
**Por que viola:** Em telas que mostram status de assinatura, qualquer botão de contato é interpretado como "Suporte a Vendas" ou "Como Comprar".

#### C. Arquivo de Risco Extremo (Lixo de Código?)
**Arquivo:** `src/pages/ConfiguracoesPagamentosDocumentacao.tsx`
**Conteúdo:** Documentação sobre como configurar Mercado Pago e Stripe.
**Risco:** Se este arquivo for acessível por qualquer rota (mesmo que oculta) ou se o revisor encontrar strings como "Mercado Pago" e "Stripe" no bundle do app, é rejeição automática. Este arquivo parece ser do painel administrativo e não deveria estar no app do aluno.

---

## 2. Plano de Correção (Passo a Passo)

Para aprovação, devemos adotar o modelo **"Reader App" (Leitor)**. O app serve apenas para *consumir* conteúdo já adquirido fora.

### Passo 1: Higienização do `SubscriptionGuard.tsx`
*   **Ação:** Remover lógica de "Renovar" e esconder botão de WhatsApp no iOS se o contexto for bloqueio.
*   **Correção:**
    *   Detectar se é iOS (`Capacitor.getPlatform() === 'ios'`).
    *   Se for iOS e estiver expirado: Mostrar **apenas** mensagem de texto neutra: *"Seu acesso a este conteúdo não está ativo. Entre em contato com seu treinador para mais informações."*
    *   **NÃO** colocar botão clicável para o WhatsApp no iOS nesta tela de bloqueio. O usuário deve sair do app e ir ao WhatsApp por conta própria se quiser pagar.

### Passo 2: Neutralização da Tela de Planos (`AssinaturasPlanos.tsx`)
*   **Ação:** Alterar o texto e comportamento.
*   **Correção:**
    *   Remover termos como "Assinatura", "Planos", "Preço". Usar "Meu Acesso", "Nível da Conta".
    *   O botão de contato deve ser estritamente para "Suporte Técnico".
    *   Mensagem do WhatsApp: *"Olá, preciso de ajuda com meu acesso ao app."* (Nunca "quero comprar" ou "renovar").

### Passo 3: Remoção de Código Morto/Perigoso
*   **Ação:** Excluir imediatamente o arquivo `src/pages/ConfiguracoesPagamentosDocumentacao.tsx`.
*   **Motivo:** Ele contém palavras-chave (Stripe, Mercado Pago, Vender) que acionam os bots de revisão da Apple.

---

## 3. Revisão de Layout e Performance

Analisei o arquivo `Agenda.tsx` e a estrutura geral.

### Pontos de Atenção (Performance)
1.  **Re-renders Desnecessários na Agenda:**
    *   O `useStudentAppointments` e `useAvailableSlots` estão bem estruturados, mas o `loadAvailableSlots` dentro do `useEffect` precisa garantir que não está sendo disparado em loop.
    *   *Correção:* O uso de `availabilityRef` que vi no código é uma boa prática para evitar loops com dependências de objetos. Mantenha isso.

2.  **Bundle Size:**
    *   O uso de `Lazy` loading nas rotas (`src/App.tsx`) está excelente. Isso mantém o tempo de inicialização baixo.

3.  **Layout (UX):**
    *   As telas de bloqueio (`SubscriptionGuard`) são muito intrusivas.
    *   *Sugestão:* Em vez de bloquear a tela inteira com um cadeado gigante (que frustra o usuário), mostre o conteúdo em modo "preview" ou "blur" com uma mensagem sutil. Porém, para aprovação rápida, mantenha o bloqueio mas suavize o texto.

---

## 4. O Formato Ideal (Para Aprovação Apple)

Para apps que vendem serviços digitais (treinos) fora da Apple Store, a regra de ouro é **Invisibilidade de Venda**.

**O que o App PODE fazer:**
*   Permitir login de contas criadas fora.
*   Acessar conteúdo liberado pelo professor.
*   Ter gestão de perfil.

**O que o App NÃO PODE fazer (no iOS):**
*   Ter botões "Assinar Agora", "Renovar", "Comprar".
*   Ter links que levam para uma página de checkout.
*   Ter textos que dizem "Acesse nosso site para comprar".
*   Mencionar preços.

**Fluxo Aprovado:**
1.  **Aluno Expirado:** Tenta acessar treino -> Tela de Bloqueio.
2.  **Mensagem:** "Acesso restrito. Contate seu administrador."
3.  **Ação:** Nenhuma ação de compra no app. O aluno já sabe que tem que pagar o personal. Ele fecha o app, vai no WhatsApp do personal, paga, o personal libera, ele volta pro app e funciona.
4.  **Dica:** No Android, você pode manter os links de WhatsApp/Pagamento se quiser, usando `Capacitor.getPlatform() !== 'ios'`.

---

## Próximos Passos (Sua Autorização)

Estou pronto para executar as correções:

1.  [ ] **Excluir** `ConfiguracoesPagamentosDocumentacao.tsx`.
2.  [ ] **Refatorar** `SubscriptionGuard.tsx` para remover links de WhatsApp no iOS e neutralizar textos.
3.  [ ] **Refatorar** `AssinaturasPlanos.tsx` para remover terminologia comercial.
4.  [ ] **Verificar** `App.tsx` para garantir que não há rotas soltas.

Aguardo seu "OK" para aplicar essas mudanças.
