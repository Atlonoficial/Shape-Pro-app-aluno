-- FASE 1: Database & Dados Base

-- 1.1: Criar/atualizar perfil completo do professor Antonio Bispo
UPDATE profiles SET
  bio = 'Personal trainer certificado com 10+ anos de experiência em musculação, condicionamento físico e coaching nutricional.',
  instagram_url = 'https://instagram.com/antoniobishop_fitness',
  facebook_url = 'https://facebook.com/antoniobishop.fit',
  youtube_url = 'https://youtube.com/@antoniobishop',
  whatsapp_url = 'https://wa.me/5511999999999',
  specialties = '["Musculação", "Condicionamento", "Nutrição", "Emagrecimento"]'::jsonb,
  phone = '+55 11 99999-9999',
  show_profile_to_students = true,
  updated_at = now()
WHERE id = '2db424b4-08d2-4ad0-9dd0-971eaab960e1';

-- 1.2: Configurar professor padrão em TODOS os tenants
UPDATE tenants 
SET default_teacher_id = '2db424b4-08d2-4ad0-9dd0-971eaab960e1',
    updated_at = now()
WHERE default_teacher_id IS NULL;

-- 1.3: Garantir que o professor padrão seja Antonio Bispo em todos os tenants
UPDATE tenants 
SET default_teacher_id = '2db424b4-08d2-4ad0-9dd0-971eaab960e1',
    updated_at = now();

-- Verificação: Listar todos os tenants com seus professores padrão
COMMENT ON COLUMN tenants.default_teacher_id IS 'Professor padrão do tenant - usado para auto-link de novos alunos';