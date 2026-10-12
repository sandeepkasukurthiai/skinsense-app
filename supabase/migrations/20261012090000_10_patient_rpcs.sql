-- Patient self-service as SECURITY DEFINER functions, so the mobile app works with
-- only the publishable key (no server hop, no secret key). Each function checks the
-- caller itself before touching data RLS would otherwise hide.

-- 1. Link the signed-in user to their clinic record, or create one.
create or replace function public.claim_patient_profile(
  p_full_name text default null,
  p_dob date default null,
  p_concern text default null
) returns public.patients
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_digits text;
  v_row patients%rowtype;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  select * into v_row from patients where auth_user_id = v_uid;
  if found then return v_row; end if;

  select phone into v_phone from auth.users where id = v_uid;
  v_digits := right(regexp_replace(coalesce(v_phone, ''), '\D', '', 'g'), 10);

  if length(v_digits) = 10 then
    -- An adult record registered at the front desk with the same mobile number.
    update patients set auth_user_id = v_uid
     where id = (select id from patients
                  where right(regexp_replace(phone, '\D', '', 'g'), 10) = v_digits
                    and guardian_patient_id is null and auth_user_id is null
                  order by created_at limit 1)
    returning * into v_row;
    if found then return v_row; end if;
  end if;

  if p_full_name is null or length(trim(p_full_name)) < 2 then
    return null; -- nothing to link; the app shows onboarding
  end if;
  if length(v_digits) <> 10 then
    raise exception 'a verified mobile number is required to create a profile';
  end if;

  insert into patients (full_name, phone, dob, presenting_concern, auth_user_id)
  values (trim(p_full_name), '+91' || v_digits, p_dob, nullif(trim(p_concern), ''), v_uid)
  returning * into v_row;
  return v_row;
end $$;

-- 2. Open booking slots for a service on a clinic day (IST), across active doctors.
--    staff.working_hours accepts {"mon_sat":["10:00","17:00"]} or
--    {"mon":[["10:00","13:00"],["14:00","17:00"]], ...}; empty = Mon–Sat 10:00–17:00.
create or replace function public.open_slots(p_service uuid, p_date date)
returns table (starts_at timestamptz, ends_at timestamptz, provider_id uuid, provider_name text)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_dur int;
  v_dow int := extract(isodow from p_date);
  v_key text := (array['mon','tue','wed','thu','fri','sat','sun'])[extract(isodow from p_date)::int];
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select duration_min into v_dur from services where id = p_service and active;
  if v_dur is null then return; end if;

  return query
  with docs as (
    select s.id, s.full_name,
      case
        when s.working_hours ? v_key then s.working_hours -> v_key
        when s.working_hours ? 'mon_sat' then
          case when v_dow <= 6 then jsonb_build_array(s.working_hours -> 'mon_sat') else '[]'::jsonb end
        when s.working_hours = '{}'::jsonb or s.working_hours is null then
          case when v_dow <= 6 then '[["10:00","17:00"]]'::jsonb else '[]'::jsonb end
        else '[]'::jsonb
      end as ranges
    from staff s
    where s.active and s.role in ('doctor', 'owner')
  ), windows as (
    select d.id, d.full_name,
      ((p_date + (r ->> 0)::time) at time zone 'Asia/Kolkata') as w_start,
      ((p_date + (r ->> 1)::time) at time zone 'Asia/Kolkata') as w_end
    from docs d, jsonb_array_elements(d.ranges) r
  ), candidates as (
    select w.id, w.full_name, g as s_start, g + make_interval(mins => v_dur) as s_end
    from windows w,
      generate_series(w.w_start, w.w_end - make_interval(mins => v_dur), interval '15 minutes') g
  )
  select c.s_start, c.s_end, c.id, c.full_name
  from candidates c
  where c.s_start >= now() + interval '30 minutes'
    and not exists (
      select 1 from appointments a
      where a.provider_id = c.id
        and a.status not in ('cancelled', 'no_show')
        and a.starts_at < c.s_end and a.ends_at > c.s_start)
  order by c.s_start, c.full_name;
end $$;

-- 3. Book a slot for yourself (or a dependant), re-checking it is still free.
create or replace function public.book_appointment(
  p_service uuid, p_provider uuid, p_starts timestamptz, p_patient uuid default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_patient uuid := coalesce(p_patient, current_patient_id());
  v_slot record;
  v_id uuid;
  v_name text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if v_patient is null or v_patient not in (select my_patient_ids()) then
    raise exception 'finish your profile before booking';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_provider::text));

  select * into v_slot
    from open_slots(p_service, (p_starts at time zone 'Asia/Kolkata')::date) s
   where s.provider_id = p_provider and s.starts_at = p_starts;
  if not found then raise exception 'that time was just taken — please pick another'; end if;

  insert into appointments (patient_id, provider_id, service_id, starts_at, ends_at, source, status)
  values (v_patient, p_provider, p_service, v_slot.starts_at, v_slot.ends_at, 'app', 'booked')
  returning id into v_id;

  -- WhatsApp confirmation, queued for the front desk to approve and send.
  select split_part(full_name, ' ', 1) into v_name from patients where id = v_patient;
  insert into message_log (patient_id, channel, template, variables, body, status)
  values (v_patient, 'whatsapp', 'skinsense_appt_confirmed',
    jsonb_build_object('name', v_name, 'when', to_char(v_slot.starts_at at time zone 'Asia/Kolkata', 'Dy DD Mon · HH12:MI AM')),
    format('Hi %s, your appointment at The Skin Sensé is confirmed for %s. Reply here if you need to reschedule.',
      v_name, to_char(v_slot.starts_at at time zone 'Asia/Kolkata', 'Dy DD Mon · HH12:MI AM')),
    'pending_approval');

  return v_id;
end $$;

revoke all on function public.claim_patient_profile(text, date, text) from public, anon;
revoke all on function public.open_slots(uuid, date) from public, anon;
revoke all on function public.book_appointment(uuid, uuid, timestamptz, uuid) from public, anon;
grant execute on function public.claim_patient_profile(text, date, text) to authenticated;
grant execute on function public.open_slots(uuid, date) to authenticated;
grant execute on function public.book_appointment(uuid, uuid, timestamptz, uuid) to authenticated;
