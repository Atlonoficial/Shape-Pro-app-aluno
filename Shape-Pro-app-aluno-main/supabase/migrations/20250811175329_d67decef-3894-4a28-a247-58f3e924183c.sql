
-- 1) Tabela de Anamnese preenchida pelo aluno e visível ao professor
create table if not exists public.anamneses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- aluno (auth.uid())
  -- Campos do formulário atual (mantemos simples e pesquisáveis)
  doencas text[] not null default '{}',
  outras_doencas text,
  alergias text[] not null default '{}',
  outras_alergias text,
  medicacoes text[] not null default '{}',
  horas_sono text,
  qualidade_sono text,
  lesoes text,
  -- Metadados
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) RLS
alter table public.anamneses enable row level security;

-- Aluno pode inserir a própria anamnese
create policy "Students can insert own anamneses"
on public.anamneses
for insert
to authenticated
with check (auth.uid() = user_id);

-- Aluno pode ver a própria anamnese
create policy "Students can view own anamneses"
on public.anamneses
for select
to authenticated
using (auth.uid() = user_id);

-- Aluno pode atualizar a própria anamnese
create policy "Students can update own anamneses"
on public.anamneses
for update
to authenticated
using (auth.uid() = user_id);

-- Professor pode ver anamneses dos seus alunos
-- Usa a função já existente: is_teacher_of(teacher_id uuid, student_user_id uuid)
create policy "Teachers can view students anamneses"
on public.anamneses
for select
to authenticated
using (is_teacher_of(auth.uid(), user_id));

-- 3) Trigger para updated_at
create trigger set_timestamp_on_anamneses
before update on public.anamneses
for each row execute procedure public.update_updated_at_column();

-- 4) Índice para consultas por user_id
create index if not exists idx_anamneses_user on public.anamneses(user_id);
