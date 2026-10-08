# Database — Supabase project `derma-app`

- Project ref: `kniwkgszwqqzgtecpory` (org **kasukurthisiblings**, region ap-south-1 / Mumbai)
- URL: `https://kniwkgszwqqzgtecpory.supabase.co`

## Migrations already on the live project

Applied 14 Sep 2026 (they live in the Supabase project's migration history):

| Version | Name |
|---|---|
| 20260914141457 | 01_enums_and_core_tables |
| 20260914141618 | 02_rls_policies |
| 20260914141702 | 03_logic_views_storage |
| 20260914141810 | 04_seed_catalogue_and_demo |
| 20260914142013 | 05_fix_phone_uniqueness_for_minors |
| 20260914142130 | 06_seed_people |
| 20260914142227 | 07_seed_courses_and_day |
| 20260914142404 | 08_harden_functions |

To bring their SQL into this folder: `npx supabase link --project-ref kniwkgszwqqzgtecpory && npx supabase db pull`.

## Added by this codebase

- `20261008150000_09_public_clinicians.sql` — read-only `v_clinicians` view so patients can see their doctor's name.

## Model at a glance

- **People:** `patients` (linked to a login via `auth_user_id`; minors via `guardian_patient_id`), `staff` (id = auth user id; role `front_desk | doctor | owner`).
- **Catalogue:** `services` → `protocols` (course template: sessions, interval, photo checkpoints) → `protocol_steps`.
- **Care:** `treatment_plans` (a patient on a protocol) → `plan_sessions` (due windows) → `session_records` (device settings, adverse events); `appointments`; `clinical_notes` (append-only, amendments); `prescriptions`; `photo_sets` (Storage bucket `clinical-photos/<patient_id>/…`); `consents`.
- **Money & messages:** `invoices` (paise, Razorpay ids), `message_log` (WhatsApp/SMS with approval states), `audit_log` (triggers on notes, Rx, photos, consents).
- **Views:** `v_day_board` (today's list), `v_drift` (patients overdue for their next session, ranked by value), `v_clinic_metrics`, `v_retention`.
- **RLS:** patients see only `my_patient_ids()` (self + dependants); staff via `is_staff()`; clinical writes need `is_clinician()`.
