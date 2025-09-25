-- FASE 1: CORRIGIR FUNÇÃO book_appointment PARA SUPORTAR AGENDAMENTO MANUAL POR PROFESSORES

-- Função atualizada que suporta especificar student_id para agendamentos manuais
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_teacher_id uuid, 
  p_scheduled_time timestamp with time zone, 
  p_type text DEFAULT 'class'::text, 
  p_duration integer DEFAULT NULL::integer, 
  p_title text DEFAULT NULL::text, 
  p_description text DEFAULT NULL::text, 
  p_student_title text DEFAULT NULL::text, 
  p_student_objectives text DEFAULT NULL::text, 
  p_student_notes text DEFAULT NULL::text,
  p_is_manual_creation boolean DEFAULT false,
  p_student_id uuid DEFAULT NULL::uuid  -- NOVO: permite especificar o aluno
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  slot_ok boolean := false;
  new_id uuid;
  step int := coalesce(p_duration, 60);
  slot_end timestamptz := p_scheduled_time + make_interval(mins => step);
  the_date date := (p_scheduled_time at time zone 'America/Sao_Paulo')::date;
  slot record;
  booking_settings record;
  current_time_br timestamptz;
  teacher_timezone text := 'America/Sao_Paulo';
  appointment_status text;
  is_teacher_creating boolean := false;
  final_student_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Determinar se é o professor criando manualmente
  if uid = p_teacher_id OR p_is_manual_creation = true then
    is_teacher_creating := true;
    
    -- Para agendamento manual, student_id deve ser especificado
    if p_student_id IS NULL then
      raise exception 'Student ID must be specified for manual appointments';
    end if;
    
    -- Validar que o aluno pertence ao professor
    if not exists (
      select 1 from public.students st
      where st.user_id = p_student_id and st.teacher_id = p_teacher_id
    ) then
      raise exception 'Student does not belong to this teacher';
    end if;
    
    final_student_id := p_student_id;
    
    -- Log do agendamento manual
    raise notice 'Manual appointment creation: teacher=%, student=%, time=%', 
      p_teacher_id, p_student_id, p_scheduled_time;
    
  else
    -- Agendamento normal do aluno
    if not exists (
      select 1 from public.students st
      where st.user_id = uid and st.teacher_id = p_teacher_id
    ) then
      raise exception 'Not authorized to book with this teacher';
    end if;
    
    final_student_id := uid;
  end if;

  -- Get current time in Brazil timezone
  current_time_br := now() AT TIME ZONE teacher_timezone;

  -- Get booking settings
  select * into booking_settings
  from public.teacher_booking_settings
  where teacher_booking_settings.teacher_id = p_teacher_id;

  -- Set defaults if no settings found
  if not found then
    booking_settings.minimum_advance_minutes := 5;
    booking_settings.visibility_days := 30;
    booking_settings.allow_same_day := true;
    booking_settings.auto_confirm := false;
  end if;

  -- Determinar status baseado na origem do agendamento
  if is_teacher_creating then
    -- Agendamentos manuais pelo professor sempre confirmados
    appointment_status := 'confirmed';
  else
    -- Agendamentos do aluno seguem a configuração auto_confirm
    if booking_settings.auto_confirm = true then
      appointment_status := 'confirmed';
    else
      appointment_status := 'scheduled'; -- Pendente confirmação manual
    end if;
  end if;

  -- Validações de tempo apenas para agendamentos de alunos
  if not is_teacher_creating then
    -- Check minimum advance time requirement
    if (p_scheduled_time AT TIME ZONE teacher_timezone) < (current_time_br + make_interval(mins => booking_settings.minimum_advance_minutes)) then
      raise exception 'Booking time is too close to current time. Minimum advance: % minutes', booking_settings.minimum_advance_minutes;
    end if;

    -- Check same day booking restriction
    if the_date = current_time_br::date and not booking_settings.allow_same_day then
      raise exception 'Same day booking is not allowed';
    end if;

    -- Use improved slot validation for student bookings
    for slot in
      select * from public.list_available_slots_improved(p_teacher_id, the_date, the_date, step)
    loop
      if slot.slot_start = p_scheduled_time and slot.slot_end = slot_end then
        slot_ok := true;
        exit;
      end if;
    end loop;

    if not slot_ok then
      raise exception 'Selected time is not available';
    end if;
  end if;

  -- ATOMIC CHECK: Verify no conflicting appointment exists (race condition protection)
  if exists (
    select 1 from public.appointments a
    where a.teacher_id = p_teacher_id
      and a.status not in ('cancelled')
      and tstzrange(a.scheduled_time, a.scheduled_time + make_interval(mins => coalesce(a.duration, step)), '[)') &&
          tstzrange(p_scheduled_time, slot_end, '[)')
  ) then
    raise exception 'Selected time slot is no longer available';
  end if;

  -- Insert appointment with correct student_id
  insert into public.appointments (
    id, teacher_id, student_id, scheduled_time, duration, status, type, title, description,
    student_title, student_objectives, student_notes
  ) values (
    extensions.uuid_generate_v4(), 
    p_teacher_id, 
    final_student_id,  -- Usar final_student_id ao invés de uid
    p_scheduled_time, 
    step, 
    appointment_status, 
    p_type,
    coalesce(p_title, case when p_type = 'assessment' then 'Avaliação' else 'Aula' end),
    p_description, 
    p_student_title, 
    p_student_objectives, 
    p_student_notes
  ) returning id into new_id;

  -- Log sucesso
  raise notice 'Appointment created successfully: id=%, teacher=%, student=%, manual=%', 
    new_id, p_teacher_id, final_student_id, is_teacher_creating;

  return new_id;
end;
$function$;

-- FASE 2: CORRIGIR DADOS INCONSISTENTES - Migração única
DO $$
DECLARE
  inconsistent_count INTEGER;
  updated_count INTEGER;
BEGIN
  -- Contar agendamentos inconsistentes onde teacher_id = student_id
  SELECT COUNT(*) INTO inconsistent_count
  FROM public.appointments 
  WHERE teacher_id = student_id 
    AND status != 'cancelled';
  
  RAISE NOTICE 'Found % inconsistent appointments where teacher_id = student_id', inconsistent_count;
  
  -- Marcar agendamentos inconsistentes como cancelados
  UPDATE public.appointments 
  SET 
    status = 'cancelled',
    cancellation_reason = 'Data correction: inconsistent teacher/student assignment',
    cancelled_at = now(),
    cancelled_by = teacher_id
  WHERE teacher_id = student_id 
    AND status != 'cancelled';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Marked % inconsistent appointments as cancelled', updated_count;
  
END $$;