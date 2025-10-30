-- Parte 2: Adicionar campos de rastreamento de termos
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(10) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS privacy_version VARCHAR(10) DEFAULT '1.0';

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Data/hora em que o usuário aceitou os Termos de Uso';
COMMENT ON COLUMN public.profiles.privacy_accepted_at IS 'Data/hora em que o usuário aceitou a Política de Privacidade';
COMMENT ON COLUMN public.profiles.terms_version IS 'Versão dos Termos de Uso aceitos';
COMMENT ON COLUMN public.profiles.privacy_version IS 'Versão da Política de Privacidade aceita';

-- Atualizar trigger para copiar novos campos do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    user_type,
    tenant_id,
    terms_accepted_at,
    privacy_accepted_at,
    terms_version,
    privacy_version
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, NULL),
    (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz,
    (NEW.raw_user_meta_data->>'privacy_accepted_at')::timestamptz,
    COALESCE(NEW.raw_user_meta_data->>'terms_version', '1.0'),
    COALESCE(NEW.raw_user_meta_data->>'privacy_version', '1.0')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
    tenant_id = COALESCE(EXCLUDED.tenant_id, profiles.tenant_id),
    terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, profiles.terms_accepted_at),
    privacy_accepted_at = COALESCE(EXCLUDED.privacy_accepted_at, profiles.privacy_accepted_at),
    terms_version = COALESCE(EXCLUDED.terms_version, profiles.terms_version),
    privacy_version = COALESCE(EXCLUDED.privacy_version, profiles.privacy_version),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';