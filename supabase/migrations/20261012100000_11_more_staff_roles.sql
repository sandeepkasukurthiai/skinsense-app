-- Eight-role model (12 Oct 2026). Patients use the mobile app; seven clinic roles use the dashboard.
--   owner            = super user (Dr. Alekya)
--   doctor           = clinician
--   staff            = therapist / clinical assistant
--   front_desk       = reception, billing and payments at the counter
--   pharmacy         = dispenses prescriptions
--   centre_manager   = runs one centre
--   operations_head  = runs operations across centres
-- Note: existing RLS gives every active staff member is_staff() access; clinical writes stay
-- limited to is_clinician() (doctor, owner). Finer per-role data scoping is Sprint 1–2 work.
alter type public.app_role add value if not exists 'staff';
alter type public.app_role add value if not exists 'pharmacy';
alter type public.app_role add value if not exists 'centre_manager';
alter type public.app_role add value if not exists 'operations_head';
