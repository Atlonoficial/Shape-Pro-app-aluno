-- Fix security vulnerability: Add SET search_path = public to SECURITY DEFINER functions

-- 1. Fix list_available_slots_improved
CREATE OR REPLACE FUNCTION public.list_available_slots_improved(p_teacher_id uuid, p_start_date date, p_end_date date, p_slot_minutes integer DEFAULT NULL::integer)
RETURNS TABLE(slot_date date, slot_start timestamp with time zone, slot_end timestamp with time zone, slot_minutes integer, slot_teacher_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  uid uuid := auth.uid();
  iter_date date;
  av record;
  exception record;
  step int;
  series_start timestamptz;
  series_end timestamptz;
  s timestamptz;
  slot_end_time timestamptz;
  wday int;
  is_exception boolean;
  has_special_hours boolean;
  booking_settings record;
  min_booking_time timestamptz;
  max_booking_date date;
  current_time_br timestamptz;
  teacher_timezone text := 'America/Sao_Paulo';
begin
  if uid is not null and uid <> p_teacher_id then
    if not exists (
      select 1 from students st
      where st.user_id = uid and st.teacher_id = p_teacher_id
    ) then
      raise exception 'Not authorized to view this teacher''s availability';
    end if;
  end if;

  current_time_br := now() AT TIME ZONE teacher_timezone;

  select * into booking_settings
  from teacher_booking_settings
  where teacher_booking_settings.teacher_id = p_teacher_id;

  if not found then
    booking_settings.minimum_advance_minutes := 5;
    booking_settings.visibility_days := 30;
    booking_settings.allow_same_day := true;
  end if;

  min_booking_time := current_time_br + make_interval(mins => booking_settings.minimum_advance_minutes);
  max_booking_date := current_time_br::date + make_interval(days => booking_settings.visibility_days);

  if p_end_date > max_booking_date then
    p_end_date := max_booking_date;
  end if;

  iter_date := p_start_date;
  
  while iter_date <= p_end_date loop
    wday := extract(dow from iter_date);
    is_exception := false;
    has_special_hours := false;
    
    if iter_date = current_time_br::date and not booking_settings.allow_same_day then
      iter_date := iter_date + 1;
      continue;
    end if;
    
    select * into exception
    from teacher_schedule_exceptions
    where teacher_schedule_exceptions.teacher_id = p_teacher_id and date = iter_date
    limit 1;
    
    if found then
      is_exception := true;
      if exception.type = 'blocked' or (exception.type = 'holiday' and not exception.is_available) then
        iter_date := iter_date + 1;
        continue;
      elsif exception.type = 'special_hours' and exception.is_available then
        has_special_hours := true;
      end if;
    end if;
    
    if has_special_hours then
      step := coalesce(p_slot_minutes, 60);
      series_start := (iter_date + exception.special_start_time) AT TIME ZONE teacher_timezone AT TIME ZONE 'UTC';
      series_end := (iter_date + exception.special_end_time) AT TIME ZONE teacher_timezone AT TIME ZONE 'UTC';
      
      s := series_start;
      while s + make_interval(mins => step) <= series_end loop
        slot_end_time := s + make_interval(mins => step);
        
        if (s AT TIME ZONE teacher_timezone) < min_booking_time then
          s := s + make_interval(mins => step);
          continue;
        end if;
        
        if not exists (
          select 1 from appointments a
          where a.teacher_id = p_teacher_id
            and a.status != 'cancelled'
            and tstzrange(a.scheduled_time, a.scheduled_time + make_interval(mins => coalesce(a.duration, step)), '[)') &&
                tstzrange(s, slot_end_time, '[)')
        ) then
          slot_date := iter_date;
          slot_start := s;
          slot_end := slot_end_time;
          slot_minutes := step;
          slot_teacher_id := p_teacher_id;
          return next;
        end if;
        
        s := s + make_interval(mins => step);
      end loop;
    else
      for av in
        select *
        from teacher_availability ta
        where ta.teacher_id = p_teacher_id and ta.weekday = wday
      loop
        step := coalesce(p_slot_minutes, av.slot_minutes, 60);
        series_start := (iter_date + av.start_time) AT TIME ZONE teacher_timezone AT TIME ZONE 'UTC';
        series_end := (iter_date + av.end_time) AT TIME ZONE teacher_timezone AT TIME ZONE 'UTC';
        
        s := series_start;
        while s + make_interval(mins => step) <= series_end loop
          slot_end_time := s + make_interval(mins => step);
          
          if (s AT TIME ZONE teacher_timezone) < min_booking_time then
            s := s + make_interval(mins => step);
            continue;
          end if;
          
          if not exists (
            select 1 from appointments a
            where a.teacher_id = p_teacher_id
              and a.status != 'cancelled'
              and tstzrange(a.scheduled_time, a.scheduled_time + make_interval(mins => coalesce(a.duration, step)), '[)') &&
                  tstzrange(s, slot_end_time, '[)')
          ) then
            slot_date := iter_date;
            slot_start := s;
            slot_end := slot_end_time;
            slot_minutes := step;
            slot_teacher_id := p_teacher_id;
            return next;
          end if;
          
          s := s + make_interval(mins => step);
        end loop;
      end loop;
    end if;
    
    iter_date := iter_date + 1;
  end loop;
  
  return;
end;
$function$;

-- 2. Fix get_workout_details_for_student
CREATE OR REPLACE FUNCTION public.get_workout_details_for_student(p_student_id uuid)
RETURNS TABLE(
  workout_id uuid,
  workout_name text,
  workout_description text,
  workout_status text,
  workout_created_at timestamp with time zone,
  exercises jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as workout_id,
    w.name as workout_name,
    w.description as workout_description,
    w.status as workout_status,
    w.created_at as workout_created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'name', e.name,
          'sets', e.sets,
          'reps', e.reps,
          'rest_seconds', e.rest_seconds,
          'notes', e.notes,
          'video_url', e.video_url,
          'order_index', e.order_index
        ) ORDER BY e.order_index
      ) FILTER (WHERE e.id IS NOT NULL),
      '[]'::jsonb
    ) as exercises
  FROM workouts w
  LEFT JOIN exercises e ON e.workout_id = w.id
  WHERE w.id IN (
    SELECT DISTINCT workout_id 
    FROM workout_assignments 
    WHERE student_id = p_student_id
  )
  GROUP BY w.id, w.name, w.description, w.status, w.created_at;
END;
$function$;

-- 3. Fix get_next_workout
CREATE OR REPLACE FUNCTION public.get_next_workout(p_student_id uuid)
RETURNS TABLE(
  workout_id uuid,
  workout_name text,
  workout_description text,
  scheduled_day text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as workout_id,
    w.name as workout_name,
    w.description as workout_description,
    wa.scheduled_day
  FROM workout_assignments wa
  JOIN workouts w ON w.id = wa.workout_id
  WHERE wa.student_id = p_student_id
    AND wa.completed = false
  ORDER BY 
    CASE wa.scheduled_day
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
      WHEN 'sunday' THEN 7
    END
  LIMIT 1;
END;
$function$;

-- 4. Fix get_student_workouts_with_progress
CREATE OR REPLACE FUNCTION public.get_student_workouts_with_progress(p_student_id uuid)
RETURNS TABLE(
  workout_id uuid,
  workout_name text,
  workout_description text,
  total_exercises integer,
  completed_exercises integer,
  progress_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as workout_id,
    w.name as workout_name,
    w.description as workout_description,
    COUNT(e.id)::integer as total_exercises,
    COUNT(wl.id)::integer as completed_exercises,
    CASE 
      WHEN COUNT(e.id) > 0 THEN ROUND((COUNT(wl.id)::numeric / COUNT(e.id)::numeric) * 100, 2)
      ELSE 0
    END as progress_percentage
  FROM workouts w
  LEFT JOIN exercises e ON e.workout_id = w.id
  LEFT JOIN workout_logs wl ON wl.workout_id = w.id AND wl.user_id = p_student_id
  WHERE w.id IN (
    SELECT DISTINCT workout_id 
    FROM workout_assignments 
    WHERE student_id = p_student_id
  )
  GROUP BY w.id, w.name, w.description;
END;
$function$;

-- 5. Fix get_teacher_revenue
CREATE OR REPLACE FUNCTION public.get_teacher_revenue(p_teacher_id uuid, p_start_date date, p_end_date date)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_revenue numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_revenue
  FROM payment_transactions
  WHERE teacher_id = p_teacher_id
    AND status = 'paid'
    AND paid_at >= p_start_date
    AND paid_at <= p_end_date;
  
  RETURN total_revenue;
END;
$function$;

-- 6. Fix get_teacher_student_count
CREATE OR REPLACE FUNCTION public.get_teacher_student_count(p_teacher_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  student_count integer;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO student_count
  FROM students
  WHERE teacher_id = p_teacher_id
    AND status = 'active';
  
  RETURN student_count;
END;
$function$;