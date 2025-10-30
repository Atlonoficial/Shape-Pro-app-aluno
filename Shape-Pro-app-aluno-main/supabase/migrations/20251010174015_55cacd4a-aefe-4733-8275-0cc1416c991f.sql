-- =========================================
-- FASE 5: Garantir user_type na tabela profiles
-- =========================================

-- Verificar se a função handle_new_user já existe e atualizá-la
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar perfil do usuário
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
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'), -- ✅ Garante user_type sempre presente
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

-- Recriar trigger se necessário (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificação de integridade: Garantir que todos os perfis existentes tenham user_type
UPDATE public.profiles
SET user_type = 'student'
WHERE user_type IS NULL;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ FASE 5: Trigger handle_new_user atualizado com sucesso';
  RAISE NOTICE '✅ Todos os perfis agora têm user_type garantido';
END $$;