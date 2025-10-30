-- ✅ BUILD 39: Atualizar RLS Policies para suportar visibilidade pública/privada

-- ===================================
-- PRODUTOS: Atualizar RLS
-- ===================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Students can view teacher products" ON products;
DROP POLICY IF EXISTS "Students can view available products" ON products;

-- Criar nova policy para alunos
CREATE POLICY "Students can view available products"
ON products FOR SELECT
USING (
  is_published = true 
  AND (
    -- Produtos globais (sem professor)
    instructor_id IS NULL
    OR
    -- Produtos públicos de qualquer professor
    is_public = true
    OR
    -- Produtos do próprio professor (públicos ou privados)
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id = auth.uid()
      AND students.teacher_id = products.instructor_id
    )
  )
);

-- ===================================
-- CURSOS: Atualizar RLS
-- ===================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Users can view all published courses" ON courses;
DROP POLICY IF EXISTS "Students can view available courses" ON courses;

-- Criar nova policy para alunos e professores verem cursos
CREATE POLICY "Students can view available courses"
ON courses FOR SELECT
USING (
  is_published = true 
  AND (
    -- Cursos globais (sem professor)
    instructor IS NULL
    OR
    -- Cursos públicos de qualquer professor
    is_public = true
    OR
    -- Cursos do próprio professor (públicos ou privados)
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id = auth.uid()
      AND students.teacher_id = courses.instructor
    )
    OR
    -- Professor vê seus próprios cursos
    auth.uid() = instructor
  )
);