-- ====================================================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA PARA SUBMISSÃO ÀS LOJAS (REVISADO)
-- ====================================================================
-- Corrige exposição pública de dados sensíveis
-- ====================================================================

-- ====================================================================
-- 1. CORRIGIR TABELA PRODUCTS
-- ====================================================================
-- Problema: Acesso público a produtos (role: public)
-- Solução: Remover acesso público, exigir autenticação

DROP POLICY IF EXISTS "Students can view published products" ON public.products;

CREATE POLICY "Authenticated users can view published products"
ON public.products
FOR SELECT
TO authenticated
USING (
  is_published = true OR 
  instructor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid() 
    AND s.teacher_id = products.instructor_id
  )
);

-- ====================================================================
-- 2. CORRIGIR TABELA SUPPORT_TICKETS  
-- ====================================================================
-- Problema: Permite acesso anônimo (anon role)
-- Solução: Exigir autenticação (nota: tabela não tem user_id,
-- é form de contato simples, então só exigimos autenticação básica)

DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;

-- Apenas usuários autenticados podem criar tickets
CREATE POLICY "Authenticated users can create support tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role pode ver todos os tickets (suporte ao cliente)
-- Esta policy já existe e está OK

-- ====================================================================
-- 3. CORRIGIR TABELA TENANT_BRANDING
-- ====================================================================
-- Problema: USING (true) permite qualquer autenticado ver qualquer branding
-- Solução: Restringir ao tenant do usuário

DROP POLICY IF EXISTS "Authenticated users can view branding" ON public.tenant_branding;

CREATE POLICY "Users can view own tenant branding"
ON public.tenant_branding
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ====================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_products_instructor_id 
  ON public.products(instructor_id);

CREATE INDEX IF NOT EXISTS idx_products_published 
  ON public.products(is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id 
  ON public.tenant_branding(tenant_id);

CREATE INDEX IF NOT EXISTS idx_students_user_teacher 
  ON public.students(user_id, teacher_id);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id 
  ON public.profiles(tenant_id);

-- ====================================================================
-- ✅ CORREÇÕES APLICADAS
-- ====================================================================
-- ✅ Products: Removido acesso público
-- ✅ Support Tickets: Removido acesso anônimo  
-- ✅ Tenant Branding: Restringido ao próprio tenant
-- ====================================================================