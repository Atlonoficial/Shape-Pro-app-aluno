-- ETAPA 4: Garantir que estudantes possam ver seus próprios dados na tabela students
-- Isso é crítico para o fallback de teacher_id funcionar

-- Verificar se a policy já existe e criar/substituir
DROP POLICY IF EXISTS "Students can view own data" ON students;

CREATE POLICY "Students can view own data" 
ON students
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Garantir que a policy de INSERT também existe para novos estudantes
DROP POLICY IF EXISTS "Students can insert own data" ON students;

CREATE POLICY "Students can insert own data" 
ON students
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Adicionar index para otimizar queries de teacher_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id_status ON students(user_id, membership_status);