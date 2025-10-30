# 🔐 Fluxo de Autenticação - App Multi-Plataforma

## 📱 Plataformas

O Shape Pro opera em duas plataformas distintas:

- **App do Aluno:** `shapepro.site` → `user_type: student`
- **Dashboard Professor:** `dashboard.shapepro.site` → `user_type: teacher`

Ambas as plataformas compartilham o mesmo backend Supabase, mas possuem fluxos de redirecionamento diferenciados após autenticação.

---

## ✉️ Confirmação de Email (ATIVA)

O sistema **exige confirmação de email** para todos os novos usuários. Isso garante que apenas emails válidos sejam cadastrados.

### 🔄 Fluxo de Signup (Cadastro)

1. **Usuário preenche formulário** (app ou dashboard)
   - Nome, email e senha
   - Plataforma detectada automaticamente

2. **`signUpUser()` cria conta com metadados inteligentes:**
   ```typescript
   {
     user_metadata: {
       name: "João Silva",
       user_type: "student" | "teacher",
       src: "app" | "dashboard",
       signup_platform: "web" | "mobile",
       is_mobile: true/false,
       // ... outros metadados
     }
   }
   ```

3. **Email redirect configurado dinamicamente:**
   - Aluno (app): `https://shapepro.site/auth/confirm?src=app`
   - Professor (dashboard): `https://dashboard.shapepro.site/auth/confirm?src=dashboard`

4. **Supabase envia email com link único**
   - Link válido por 1 hora (configurável)
   - Contém token de verificação único

5. **Usuário clica no link → `AuthConfirm.tsx` processa:**
   ```
   ┌─────────────────────────────────────────┐
   │  1. Verificar token                     │
   │  2. Criar sessão ativa                  │
   │  3. Detectar user_type (prioridade):    │
   │     a) user_metadata.user_type          │
   │     b) user_metadata.src                │
   │     c) URL parameter src                │
   │     d) Fallback: student                │
   │  4. Redirecionar para plataforma certa  │
   └─────────────────────────────────────────┘
   ```

6. **Redirecionamento inteligente:**
   - `student` → `/` (homepage do app)
   - `teacher` → `/dashboard-professor` (painel administrativo)

---

## 🔑 Fluxo de Login (Email Não Confirmado)

### Problema Identificado
Quando um usuário tenta fazer login antes de confirmar o email, o Supabase retorna:
```
"Invalid login credentials"
```

Este erro é **genérico** e não diferencia entre:
- ❌ Email não confirmado
- ❌ Senha incorreta
- ❌ Email não existe

### Solução Implementada

#### 1. Detecção Proativa em `signInUser()` (`src/lib/supabase.ts`)

```typescript
export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      // 🔍 Verificar se email existe na tabela profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .limit(1);
      
      if (profiles && profiles.length > 0) {
        // ✅ Email existe → problema é email não confirmado
        throw new Error('Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.');
      }
      
      // ❌ Email não existe → credenciais inválidas
      throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
    }
    
    throw error;
  }
  
  return data.user;
};
```

#### 2. UX Melhorada em `AuthScreen.tsx`

```typescript
const handleSignIn = async (e: React.FormEvent) => {
  try {
    await signInUser(email, password);
    // ... login bem-sucedido
  } catch (error: any) {
    // 🎯 Detectar erro específico de email não confirmado
    if (error.message.includes('não confirmado')) {
      toast({
        title: "⚠️ Email não confirmado",
        description: "Verifique sua caixa de entrada antes de fazer login.",
        variant: "destructive",
      });
      
      // 💡 Dica após 2 segundos
      setTimeout(() => {
        toast({
          title: "💡 Dica",
          description: "Não recebeu o email? Clique em 'Criar Conta' novamente para reenviar.",
        });
      }, 2000);
      
      return;
    }
    
    // Erro genérico
    toast({
      title: "Erro no login",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

---

## 🔄 Reset de Senha

### Fluxo Atualizado

1. **Usuário solicita reset** (esqueceu senha)
2. **Sistema detecta origem** (app ou dashboard)
3. **`resetPasswordForEmail()` adiciona `src` parameter:**
   ```typescript
   const srcParam = userType === 'teacher' ? 'dashboard' : 'app';
   const redirectUrl = `https://shapepro.site/auth/recovery?src=${srcParam}`;
   ```
4. **Email enviado com link de reset**
5. **Usuário clica → `AuthRecovery.tsx`**
6. **Redirecionamento correto após reset**

---

## 🛡️ Segurança: Trigger `handle_new_user`

### Objetivo
Garantir que **SEMPRE** que um usuário se cadastrar, seu `user_type` seja salvo corretamente na tabela `profiles`.

### Implementação

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    user_type,
    tenant_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'), -- ✅ Garante fallback
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
    tenant_id = COALESCE(EXCLUDED.tenant_id, profiles.tenant_id),
    updated_at = now();
  
  RETURN NEW;
END;
$$;
```

### Proteções
- ✅ `COALESCE` garante que `user_type` nunca seja NULL
- ✅ `ON CONFLICT DO UPDATE` evita erros em cadastros duplicados
- ✅ `SECURITY DEFINER` garante execução com privilégios corretos

---

## 🔍 Troubleshooting

### Problema: Professor redirecionado para app do aluno

**Causa:** `user_type` não foi salvo corretamente nos metadados do usuário.

**Solução:**
1. Verificar logs no console:
   ```javascript
   console.log('AuthConfirm: Fontes de user_type:', {
     userTypeFromMetadata,
     srcFromMetadata,
     srcFromUrl
   });
   ```
2. Checar se o trigger `handle_new_user` está ativo:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Verificar `auth.users` metadata:
   ```sql
   SELECT id, email, raw_user_meta_data->>'user_type' as user_type
   FROM auth.users 
   WHERE email = 'email@example.com';
   ```

### Problema: "Invalid login credentials" persistente

**Causa:** Email não foi confirmado OU senha está incorreta.

**Solução:**
1. Verificar se email existe na tabela `profiles`
2. Se existir → Email não confirmado (reenviar confirmação)
3. Se não existir → Senha incorreta ou email não cadastrado

### Problema: Link de confirmação expirado

**Causa:** Usuário demorou mais de 1 hora para clicar no link.

**Solução:**
1. Ir para tela de cadastro
2. Reenviar email de confirmação usando o mesmo email
3. Supabase irá reenviar automaticamente

---

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP (Cadastro)                        │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário preenche formulário                             │
│  2. signUpUser() detecta origem (app/dashboard)             │
│  3. Cria user com metadata (user_type, src, etc.)           │
│  4. Supabase envia email com link + src parameter           │
│  5. Trigger handle_new_user salva em profiles               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              EMAIL CONFIRMATION (Confirmação)               │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário clica no link do email                          │
│  2. AuthConfirm processa token                              │
│  3. Cria sessão ativa                                       │
│  4. Detecta user_type (prioridade):                         │
│     a) user_metadata.user_type                              │
│     b) user_metadata.src                                    │
│     c) URL parameter src                                    │
│     d) Fallback: student                                    │
│  5. Redireciona para plataforma correta                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    ┌──────────────┐         ┌──────────────┐
    │   student    │         │   teacher    │
    │      →       │         │      →       │
    │      /       │         │  /dashboard  │
    │   (app)      │         │  (dashboard) │
    └──────────────┘         └──────────────┘
```

---

## 🚀 Próximos Passos

Para manter o sistema robusto:

1. **Monitorar logs** de autenticação regularmente
2. **Testar fluxo** em ambas as plataformas após cada deploy
3. **Revisar RLS policies** periodicamente para garantir segurança
4. **Configurar alertas** para falhas de autenticação frequentes
5. **Documentar mudanças** em qualquer alteração no fluxo de auth

---

## 📝 Changelog

**2025-01-20 - v1.0 - Correção Multi-Plataforma**
- ✅ Adicionado parâmetro `src` aos links de confirmação
- ✅ Melhorada lógica de redirecionamento em `AuthConfirm`
- ✅ Implementada detecção de email não confirmado no login
- ✅ Adicionada UX melhorada com toasts informativos
- ✅ Garantido `user_type` via trigger `handle_new_user`
- ✅ Criada documentação completa do fluxo de auth

---

**Documentação mantida por:** Shape Pro Dev Team  
**Última atualização:** 2025-01-20
