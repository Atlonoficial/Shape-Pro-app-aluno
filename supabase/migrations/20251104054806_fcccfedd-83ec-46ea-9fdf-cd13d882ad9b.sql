-- ✅ BUILD 52: Otimizações de performance para workout_plans e meal_plans

-- Criar índice GIN para acelerar queries com contains em JSONB arrays
CREATE INDEX IF NOT EXISTS idx_workout_plans_assigned_students 
ON workout_plans USING GIN (assigned_students);

-- Criar índice composto para filtros comuns (status + assigned_students)
CREATE INDEX IF NOT EXISTS idx_workout_plans_status_created 
ON workout_plans (status, created_at DESC);

-- Criar índice para meal_plans assigned_students
CREATE INDEX IF NOT EXISTS idx_meal_plans_assigned_students 
ON meal_plans USING GIN (assigned_students);

-- Criar índice composto para meal_plans (status + assigned_students)
CREATE INDEX IF NOT EXISTS idx_meal_plans_status_created 
ON meal_plans (status, created_at DESC);