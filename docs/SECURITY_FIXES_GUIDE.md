# 🔒 Guia de Correção de Warnings de Segurança - Shape Pro

## ⚠️ Status Atual: 12 Warnings Detectados

Este guia contém instruções detalhadas para corrigir os 12 warnings de segurança detectados pelo Supabase Linter.

---

## 📊 Resumo dos Warnings

| Prioridade | Categoria | Quantidade | Tempo Estimado |
|-----------|-----------|------------|----------------|
| 🔴 ALTA | Function Search Path | 8 | 30 min |
| 🟡 MÉDIA | Extension in Public | 2 | 15 min |
| 🟡 MÉDIA | Auth OTP Long Expiry | 1 | 5 min |
| 🟡 MÉDIA | Leaked Password Protection | 1 | 2 min |
| 🟢 BAIXA | Postgres Version | 1 | 30 min |

**Tempo Total:** ~1h30min

---

## 🔧 CORREÇÃO 1: Function Search Path Mutable (8 warnings)

### ⚠️ Problema
Funções SQL não têm `search_path` explícito, o que pode causar vulnerabilidades de segurança se um usuário malicioso criar schemas com nomes específicos.

### ✅ Solução
Para cada função listada abaixo, executar o comando `ALTER FUNCTION`:

#### Funções Afetadas:
1. `public.update_updated_at_column()`
2. `public.handle_new_user()`
3. `public.update_profile_updated_at()`
4. `public.update_course_updated_at()`
5. `public.update_module_updated_at()`
6. `public.check_module_completion()`
7. `public.update_progress_updated_at()`
8. `public.update_workout_updated_at()`

#### Script SQL Completo:
```sql
-- Execute no Supabase SQL Editor

-- 1. update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public;

-- 2. handle_new_user
ALTER FUNCTION public.handle_new_user() 
SET search_path = public;

-- 3. update_profile_updated_at
ALTER FUNCTION public.update_profile_updated_at() 
SET search_path = public;

-- 4. update_course_updated_at
ALTER FUNCTION public.update_course_updated_at() 
SET search_path = public;

-- 5. update_module_updated_at
ALTER FUNCTION public.update_module_updated_at() 
SET search_path = public;

-- 6. check_module_completion
ALTER FUNCTION public.check_module_completion() 
SET search_path = public;

-- 7. update_progress_updated_at
ALTER FUNCTION public.update_progress_updated_at() 
SET search_path = public;

-- 8. update_workout_updated_at
ALTER FUNCTION public.update_workout_updated_at() 
SET search_path = public;

-- Verificar se aplicado corretamente
SELECT 
  p.proname as function_name,
  pg_catalog.array_to_string(p.proconfig, ', ') as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proconfig IS NOT NULL;
```

#### ✅ Resultado Esperado:
Todas as 8 funções devem aparecer com `search_path=public` na configuração.

---

## 🔧 CORREÇÃO 2: Extension in Public Schema (2 warnings)

### ⚠️ Problema
Extensões PostgreSQL estão instaladas no schema `public`, o que pode causar conflitos e vulnerabilidades.

### ✅ Solução
Mover extensões para o schema `extensions`.

#### Extensões Afetadas:
1. `pg_stat_statements`
2. `pgcrypto` (ou outra extensão detectada)

#### Script SQL:
```sql
-- Execute no Supabase SQL Editor

-- Criar schema extensions (se não existir)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover pg_stat_statements
ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;

-- Mover pgcrypto (se instalada)
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

-- Verificar
SELECT 
  e.extname,
  n.nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('pg_stat_statements', 'pgcrypto');
```

#### ⚠️ IMPORTANTE:
Após mover extensões, pode ser necessário atualizar referências em funções:
```sql
-- Exemplo: se alguma função usa pgcrypto
ALTER FUNCTION function_name SET search_path = public, extensions;
```

---

## 🔧 CORREÇÃO 3: Auth Users Exposed (implicit)

### ⚠️ Problema
Embora não listado explicitamente, é boa prática verificar se `auth.users` não está exposto.

### ✅ Verificação:
```sql
-- Verificar políticas RLS em auth.users
SELECT * FROM pg_policies WHERE schemaname = 'auth' AND tablename = 'users';

-- Se não houver políticas, está protegido (padrão Supabase)
```

#### ✅ Resultado Esperado:
Nenhuma política RLS em `auth.users` (Supabase gerencia internamente).

---

## 🔧 CORREÇÃO 4: Auth OTP Expiry Too Long (1 warning)

### ⚠️ Problema
OTP (One-Time Password) expira em **3600 segundos (1 hora)**, o que é muito longo e aumenta janela de ataque.

### ✅ Solução
Reduzir para **300 segundos (5 minutos)**.

#### Passos (Supabase Dashboard):
1. Ir para **Authentication** → **Settings**
2. Procurar por **"Email OTP Expiry"**
3. Alterar de `3600` para `300`
4. Clicar em **Save**

#### Ou via SQL (se disponível):
```sql
-- Verificar valor atual
SELECT * FROM auth.config WHERE key = 'external_email_otp_expiry';

-- Atualizar para 5 minutos
UPDATE auth.config 
SET value = '300' 
WHERE key = 'external_email_otp_expiry';
```

---

## 🔧 CORREÇÃO 5: Leaked Password Protection Disabled (1 warning)

### ⚠️ Problema
Proteção contra senhas vazadas (HaveIBeenPwned) está desativada.

### ✅ Solução
Ativar no dashboard do Supabase.

#### Passos:
1. Ir para **Authentication** → **Settings** → **Password**
2. Ativar **"Enable leaked password protection"**
3. Clicar em **Save**

#### ✅ Resultado:
Usuários não poderão usar senhas que aparecem em vazamentos públicos conhecidos.

---

## 🔧 CORREÇÃO 6: Postgres Version Outdated (1 warning)

### ⚠️ Problema
Postgres está em versão desatualizada. Versão recomendada: **15.x ou superior**.

### ✅ Solução
Fazer upgrade via dashboard (pode causar **2-5 minutos de downtime**).

#### Passos:
1. Ir para **Settings** → **Infrastructure**
2. Procurar por **"Postgres Version"**
3. Clicar em **"Upgrade to PostgreSQL 15"** (ou versão mais recente)
4. Confirmar upgrade

#### ⚠️ ATENÇÃO:
- **Backup automático** será criado antes do upgrade
- **Downtime de 2-5 minutos** durante o processo
- **Testar aplicação** após upgrade

#### Verificação Pós-Upgrade:
```sql
SELECT version();
-- Deve retornar: PostgreSQL 15.x ou superior
```

---

## 📋 Checklist de Execução

### Antes de Começar:
- [ ] Backup do banco de dados criado
- [ ] Ambiente de testes disponível (opcional)
- [ ] Janela de manutenção agendada (para upgrade Postgres)

### Execução:
- [ ] **CORREÇÃO 1:** Function Search Path (8 funções) ✅
- [ ] **CORREÇÃO 2:** Extension in Public (2 extensões) ✅
- [ ] **CORREÇÃO 3:** Auth Users Exposed (verificação) ✅
- [ ] **CORREÇÃO 4:** Auth OTP Expiry (300s) ✅
- [ ] **CORREÇÃO 5:** Leaked Password Protection (ativado) ✅
- [ ] **CORREÇÃO 6:** Postgres Version (upgrade) ✅

### Após Correções:
- [ ] Executar `supabase linter` novamente
- [ ] Verificar que 0 warnings críticos permanecem
- [ ] Testar fluxo de autenticação completo
- [ ] Testar fluxo de pagamento completo
- [ ] Verificar logs de erros no Supabase Dashboard

---

## 🧪 Validação Final

### Script de Validação Completa:
```sql
-- 1. Verificar funções com search_path
SELECT 
  p.proname,
  pg_catalog.array_to_string(p.proconfig, ', ') as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%update%' OR p.proname LIKE '%handle%';

-- 2. Verificar extensões
SELECT 
  e.extname,
  n.nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid;

-- 3. Verificar versão do Postgres
SELECT version();

-- 4. Verificar configurações de autenticação
SELECT * FROM auth.config 
WHERE key IN ('external_email_otp_expiry', 'enable_password_breach_protection');
```

### ✅ Resultados Esperados:
1. **8 funções** com `search_path=public`
2. **Extensões** no schema `extensions`
3. **Postgres** versão 15.x ou superior
4. **OTP Expiry** = 300
5. **Leaked Password Protection** = enabled

---

## 🚨 Troubleshooting

### Erro: "permission denied to set parameter"
**Solução:** Usar conta com role `postgres` ou `supabase_admin`.

### Erro: "extension in use"
**Solução:** Verificar se há funções usando a extensão antes de mover:
```sql
SELECT p.proname 
FROM pg_proc p
WHERE prosrc LIKE '%pgcrypto%';
```

### Upgrade Postgres falhou
**Solução:** 
1. Verificar espaço em disco disponível
2. Contatar suporte Supabase
3. Restaurar do backup automático se necessário

---

## 📊 Impacto Esperado

### Após Aplicar Todas as Correções:

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Warnings Críticos | 12 | 0 | ✅ 100% |
| Segurança de Funções | ⚠️ Vulnerável | ✅ Protegido | +100% |
| Proteção de Senhas | ❌ Desativado | ✅ Ativado | +100% |
| Janela de Ataque OTP | 1 hora | 5 minutos | ✅ -83% |
| Versão Postgres | Desatualizada | Atualizada | ✅ +Security patches |

---

## 📞 Suporte

- **Supabase Docs:** https://supabase.com/docs/guides/database/securing-your-database
- **Supabase Discord:** https://discord.supabase.com
- **PostgreSQL Security:** https://www.postgresql.org/docs/current/ddl-schemas.html

---

**Última atualização:** 04/11/2025 - BUILD 52
**Status:** 📋 Aguardando execução
**Prioridade:** 🟡 Média (Recomendado antes de publicação em larga escala)
