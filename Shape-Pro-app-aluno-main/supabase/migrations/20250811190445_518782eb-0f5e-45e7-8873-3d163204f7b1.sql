-- Create missing tables for medical exams and progress photos

-- Medical exams table
create table if not exists public.medical_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  date date not null,
  file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.medical_exams enable row level security;

-- RLS policies for medical_exams
create policy "Users can view own medical exams"
  on public.medical_exams for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own medical exams"
  on public.medical_exams for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own medical exams"
  on public.medical_exams for update to authenticated
  using (auth.uid() = user_id);

create policy "Teachers can view students medical exams"
  on public.medical_exams for select to authenticated
  using (is_teacher_of(auth.uid(), user_id));

-- Progress photos table
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  image_url text not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

-- RLS policies for progress_photos
create policy "Users can view own progress photos"
  on public.progress_photos for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own progress photos"
  on public.progress_photos for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own progress photos"
  on public.progress_photos for update to authenticated
  using (auth.uid() = user_id);

create policy "Teachers can view students progress photos"
  on public.progress_photos for select to authenticated
  using (is_teacher_of(auth.uid(), user_id));

-- Add updated_at triggers
create trigger medical_exams_updated_at
  before update on public.medical_exams
  for each row execute function public.update_updated_at_column();

create trigger progress_photos_updated_at
  before update on public.progress_photos
  for each row execute function public.update_updated_at_column();