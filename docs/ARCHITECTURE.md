# Architecture

```
┌──────────────────────┐        ┌───────────────────────────────┐        ┌────────────────────────┐
│ Patient app (Expo)   │──RLS──▶│ Supabase (derma-app, Mumbai)  │◀──RLS──│ Clinic dashboard       │
│ iOS / Android        │        │ Postgres · Auth · Storage     │        │ Next.js (server pages, │
│                      │──API──▶│                               │◀─admin─│ server actions)        │
└──────────────────────┘  Bearer└───────────────────────────────┘        │ + /api/* route handlers│
         ▲   token to dashboard /api/*                                    └──────────┬─────────────┘
         │                                                                           │
         │  WhatsApp messages                     ┌──────────────┐   ┌───────────────┴──────┐
         └────────────────────────────────────────│ WhatsApp     │   │ Razorpay             │
                                                  │ Cloud API    │   │ Payment Links + hook │
                                                  └──────────────┘   └──────────────────────┘
```

## Two ways to the data

1. **Direct, under Row Level Security.** Both apps talk to Supabase with the publishable key and the user's session.
   Policies (already on the live project) decide what each person sees:
   - patients: rows where `patient_id in my_patient_ids()` (self + dependants), read-only except cancelling a booked visit and consents;
   - staff: everything via `is_staff()`; clinical writes (notes, prescriptions, protocols) need `is_clinician()`.
2. **Through the dashboard's API, with the secret key.** Only for things RLS deliberately doesn't allow a patient to do on their own:

| Route | Who | Why it needs the server |
|---|---|---|
| `POST /api/patient/claim` | patient | Link a verified phone to an existing clinic record, or create one (patients can't insert into `patients`) |
| `GET /api/patient/slots` | patient | Compute free times — needs other patients' bookings, which patients can't read |
| `POST /api/patient/book` | patient | Re-check the slot is still free, insert, send WhatsApp confirmation |
| `POST /api/payments/link` | patient | Create a Razorpay payment link (needs the Razorpay secret) |
| `POST /api/payments/webhook` | Razorpay | Verify signature, mark invoice paid (idempotent) |
| `GET/POST /api/whatsapp/webhook` | Meta | Verification handshake, delivery receipts → `message_log` |
| `GET /api/cron/reminders` | Vercel Cron | Tomorrow's reminders; drift nudges parked for approval |

Every API route verifies the caller first (bearer token → `auth.getUser`, HMAC signature, or cron secret) before using the admin client.

## Dashboard conventions (Next.js 16)

- **Cache Components** is on. Pages render a static shell; anything that reads the session sits in a `<Suspense>` boundary.
- `src/proxy.ts` (Next 16's name for middleware) refreshes the Supabase cookie and redirects signed-out visitors — an optimistic check only.
- `src/lib/dal.ts → requireStaff(roles?)` is the real gate, called by every data section and every server action.
- Server actions live in `src/app/(clinic)/actions.ts` and call `refresh()` after writes.

## App conventions (Expo SDK 57)

- Expo Router with `Stack.Protected` guards: signed out → `sign-in`; signed in without a patient record → `onboarding`; otherwise tabs.
- Custom tab bar with the raised plum **Book** button from the design.
- `src/lib/queries.ts` holds every Supabase read; `useQuery` re-runs on screen focus.
- Brand tokens come from `@skinsense/shared` so app and dashboard stay identical.

## Data model notes

- Money is integer **paise** everywhere (`formatINR` in shared).
- All times are stored UTC and shown in **Asia/Kolkata**.
- `invoices.razorpay_order_id` holds the Razorpay **payment link** id (`plink_…`); the webhook fills `razorpay_payment_id`.
- `prescriptions.items` and `invoices.lines` are JSON arrays typed by `RxItem` / `InvoiceLine` in shared.
- `staff.working_hours` drives booking slots: `{ "mon": [["10:00","13:00"],["14:00","17:00"]], … }`. Empty → Mon–Sat 10:00–17:00.
- `v_clinicians` (added 8 Oct 2026) exposes only doctors' names/qualifications so patients can see who they're seeing.

## Not built yet (next sprints)

- Progress-photo capture and side-by-side comparison (Storage bucket `clinical-photos` and policies exist)
- Push notifications (expo-notifications is installed and configured)
- Guardian view for children's records (schema supports it via `guardian_patient_id`)
- Inbound WhatsApp chat handling, tele-consult video, owner reports (`v_retention`)
- Automated tests and CI
