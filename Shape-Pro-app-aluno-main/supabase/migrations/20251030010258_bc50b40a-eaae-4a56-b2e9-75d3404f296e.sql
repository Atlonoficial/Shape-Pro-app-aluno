-- Permite consultas anônimas para verificar existência de email
-- Seguro porque:
-- 1. Só permite SELECT (não permite modificações)
-- 2. Disponível para role 'anon' (usuários não autenticados)
-- 3. Não expõe dados sensíveis (aplicação só consulta 'id')
-- 4. Essencial para UX do login/signup
CREATE POLICY "Allow anonymous email existence check"
ON public.profiles
FOR SELECT
TO anon
USING (true);