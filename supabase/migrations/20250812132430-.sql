-- 1) Teacher availability table
create table if not exists public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.teacher_availability enable row level security;

-- Policies: teachers manage their own availability
create policy if not exists "Teachers can view own availability"
  on public.teacher_availability
  for select
  using (auth.uid() = teacher_id);

create policy if not exists "Teachers can insert own availability"
  on public.teacher_availability
  for insert
  with check (auth.uid() = teacher_id);

create policy if not exists "Teachers can update own availability"
  on public.teacher_availability
  for update
  using (auth.uid() = teacher_id);

create policy if not exists "Teachers can delete own availability"
  on public.teacher_availability
  for delete
  using (auth.uid() = teacher_id);

-- Trigger to keep updated_at fresh (reuses existing helper)
create trigger if not exists set_updated_at_teacher_availability
before update on public.teacher_availability
for each row execute function public.update_updated_at_column();


-- 2) List available slots for a given teacher and date
-- Returns slots that do not conflict with existing appointments (except cancelled)
create or replace function public.list_available_slots(
  p_teacher_id uuid,
  p_date date,
  p_slot_minutes int default null
)
returns table (
  slot_start timestamptz,
  slot_end timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wday int := extract(dow from p_date);
  av record;
  step int;
  series_start timestamptz;
  series_end timestamptz;
  s timestamptz;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Allow teacher or their assigned students
  if uid <> p_teacher_id then
    if not exists (
      select 1 from public.students st
      where st.user_id = uid and st.teacher_id = p_teacher_id
    ) then
      raise exception 'Not authorized to view this teacher''s availability';
    end if;
  end if;

  for av in
    select *
    from public.teacher_availability
    where teacher_id = p_teacher_id and weekday = wday
  loop
    step := coalesce(p_slot_minutes, av.slot_minutes, 60);

    -- Build day timestamps in UTC; adjust per project needs if timezones are introduced later
    series_start := (p_date::timestamptz + av.start_time);
    series_end   := (p_date::timestamptz + av.end_time);

    for s in
      select generate_series(series_start, series_end - make_interval(mins => step), make_interval(mins => step))
    loop
      if not exists (
        select 1 from public.appointments a
        where a.teacher_id = p_teacher_id
          and coalesce(a.status, 'scheduled') <> 'cancelled'
          and tstzrange(a.scheduled_time, a.scheduled_time + make_interval(mins => coalesce(a.duration, step)), '[)') &&
              tstzrange(s, s + make_interval(mins => step), '[)')
      ) then
        slot_start := s;
        slot_end := s + make_interval(mins => step);
        return next;
      end if;
    end loop;
  end loop;

  return;
end;
$$;


-- 3) Book appointment as student (or teacher)
create or replace function public.book_appointment(
  p_teacher_id uuid,
  p_scheduled_time timestamptz,
  p_type text default 'class',
  p_duration int default null,
  p_title text default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  slot_ok boolean := false;
  new_id uuid;
  step int := coalesce(p_duration, 60);
  slot_end timestamptz := p_scheduled_time + make_interval(mins => step);
  the_date date := (p_scheduled_time at time zone 'UTC')::date;
  slot record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Allow teacher or their assigned students to book; most common path is student booking
  if uid <> p_teacher_id then
    if not exists (
      select 1 from public.students st
      where st.user_id = uid and st.teacher_id = p_teacher_id
    ) then
      raise exception 'Not authorized to book with this teacher';
    end if;
  end if;

  -- Ensure requested time matches one of the available slots
  for slot in
    select * from public.list_available_slots(p_teacher_id, the_date, step)
  loop
    if slot.slot_start = p_scheduled_time and slot.slot_end = slot_end then
      slot_ok := true;
      exit;
    end if;
  end loop;

  if not slot_ok then
    raise exception 'Selected time is not available';
  end if;

  -- Insert appointment. SECURITY DEFINER ensures it bypasses teacher-only insert policy.
  insert into public.appointments (
    id, teacher_id, student_id, scheduled_time, duration, status, type, title, description
  ) values (
    extensions.uuid_generate_v4(), p_teacher_id, uid, p_scheduled_time, step, 'scheduled', p_type,
    coalesce(p_title, case when p_type = 'assessment' then 'Avaliação' else 'Aula' end),
    p_description
  ) returning id into new_id;

  return new_id;
end;
$$;