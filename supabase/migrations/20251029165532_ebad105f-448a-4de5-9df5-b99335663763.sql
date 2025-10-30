-- ✅ BUILD 39: Adicionar coluna is_public para controle de visibilidade

-- Adicionar coluna is_public em products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Adicionar coluna is_public em courses
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_visibility 
ON products(is_published, is_public);

CREATE INDEX IF NOT EXISTS idx_courses_visibility 
ON courses(is_published, is_public);

-- Atualizar produtos existentes para serem públicos por padrão
UPDATE products SET is_public = true WHERE is_public IS NULL;

-- Atualizar cursos existentes para serem públicos por padrão
UPDATE courses SET is_public = true WHERE is_public IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN products.is_public IS 'true = visível para todos alunos | false = apenas alunos do professor';
COMMENT ON COLUMN courses.is_public IS 'true = visível para todos alunos | false = apenas alunos do professor';