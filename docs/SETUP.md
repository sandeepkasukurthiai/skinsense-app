# Setup

## 1. Supabase (project `derma-app`)

Dashboard: https://supabase.com/dashboard/project/kniwkgszwqqzgtecpory

1. **Secret key** — Project Settings → API Keys → *Secret keys* → copy into `apps/dashboard/.env.local` as `SUPABASE_SECRET_KEY`.
2. **Phone sign-in for patients** — Authentication → Sign In / Providers → **Phone** → enable, and pick an SMS provider
   (Twilio, MessageBird, Vonage or Textlocal). For the demo you can add *test phone numbers* with fixed OTPs there instead.
3. **Staff accounts** — for each team member:
   - Authentication → Users → *Add user* (email + password, auto-confirm).
   - Then in the SQL editor:
     ```sql
     insert into public.staff (id, full_name, role, qualification)
     values ('<auth user id>', 'Dr. Alekya Singapore', 'owner', 'MBBS, MD (DVL)');
     ```
     Roles: `front_desk`, `doctor`, `owner`. Optionally set `working_hours`, e.g.
     `'{"mon":[["10:00","17:00"]],"tue":[["10:00","17:00"]],"wed":[["10:00","17:00"]],"thu":[["10:00","17:00"]],"fri":[["10:00","17:00"]],"sat":[["10:00","17:00"]]}'`.
4. **Catalogue** — add `services` (name, line, duration, price in paise) and `protocols` (course templates) if they aren't there yet.

Regenerate DB types after schema changes: `npx supabase login` once, then `npm run db:types`.

## 2. Razorpay

1. Dashboard → Account & Settings → **API Keys** → generate (start in *Test mode*) → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
2. **Webhooks** → add `https://<dashboard-domain>/api/payments/webhook`, event **payment_link.paid**, set a secret → `RAZORPAY_WEBHOOK_SECRET`.
3. `APP_BASE_URL` = the dashboard's public URL (patients land on `/paid` after paying).

## 3. WhatsApp Cloud API

1. Meta for Developers → create an app → add **WhatsApp** → note the *Phone number ID* and a permanent access token
   → `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`.
2. In WhatsApp Manager create and get approved these **Utility** templates (language `en`), body variables in this order:
   | Template | Variables |
   |---|---|
   | `skinsense_appt_confirmed` | {{1}} name, {{2}} date & time |
   | `skinsense_appt_reminder` | {{1}} name, {{2}} date & time |
   | `skinsense_session_due` | {{1}} name, {{2}} session number, {{3}} course name |
   | `skinsense_payment_link` | {{1}} name, {{2}} amount, {{3}} link |
   The suggested wording is in `packages/shared/src/messages.ts`.
3. Webhook: callback `https://<dashboard-domain>/api/whatsapp/webhook`, verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe to *messages*.
4. Keep `WHATSAPP_MODE=dry-run` until templates are approved — messages are logged in the dashboard's WhatsApp page but not sent.

## 4. Deploy

**Dashboard → Vercel**
- New project from this repo, *Root directory* `apps/dashboard`, framework Next.js. Add every variable from `.env.example`.
- `apps/dashboard/vercel.json` schedules `/api/cron/reminders` daily at 13:00 UTC (6:30 PM IST). Set `CRON_SECRET` in Vercel; Vercel sends it automatically.

**Patient app → EAS**
```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init            # links the project to your Expo account
npx eas-cli@latest build --profile preview --platform android   # installable APK for the demo
```
Set `EXPO_PUBLIC_API_URL` to the deployed dashboard URL (EAS → Environment variables) before building.
Replace the placeholder icons in `apps/mobile/assets/images` with The Skin Sensé artwork.
