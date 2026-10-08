-- Patients cannot read the staff table (RLS: staff_self_read is staff-only),
-- but the app needs to show "with Dr. Alekya Singapore" on appointments.
-- Expose only the public profile of active clinicians to signed-in users.

create or replace view public.v_clinicians
with (security_invoker = false) as
select s.id, s.full_name, s.qualification, s.role
from public.staff s
where s.active and s.role in ('doctor', 'owner');

revoke all on public.v_clinicians from anon, public;
grant select on public.v_clinicians to authenticated;

comment on view public.v_clinicians is
  'Public profile of active clinicians (name, qualification) for the patient app. No contact or registration data.';
