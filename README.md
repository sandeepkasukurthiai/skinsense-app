# The Skin Sensé — App

Patient app and clinic dashboard for **The Skin Sensé**, Dr. Alekya Singapore's dermatology clinic in Banjara Hills, Hyderabad.
Pilot go-live: **25 December 2026**.

```
apps/
  mobile/      Expo (React Native) patient app — iOS & Android
  dashboard/   Next.js clinic dashboard for front desk & doctors, plus the API the app calls
packages/
  shared/      Database types, brand tokens, formatting, domain helpers, WhatsApp templates
supabase/      Notes + migrations for the live Supabase project "derma-app"
docs/          Architecture and setup guides
```

## What's in the first cut

**Patient app** (Expo SDK 57, Expo Router)
- Sign in with mobile number + SMS OTP; first sign-in links to the clinic record on that phone, or creates a profile
- Home: next visit, quick actions, treatment-course progress, today's regimen (from the latest prescription), treatments, clinic trust strip
- Book: pick treatment → day → live open slots across doctors → confirm (WhatsApp confirmation)
- Journey: courses with every session's due window, and visit history; cancel an upcoming visit
- Prescriptions, bills with **Razorpay** "Pay securely", profile with call / WhatsApp / directions

**Clinic dashboard** (Next.js 16, Tailwind 4)
- Staff sign-in (email + password), role-aware (front desk, doctor, owner)
- **Today**: clinic metrics + day board with one-click status flow (booked → arrived → in chair → completed / no-show), consent and minor flags
- **Patients**: search, register, full record — courses (start from protocol, record session settings), notes, prescriptions, consents, visits, bills
- **Appointments**: week view + booking with clash check and optional WhatsApp confirmation
- **Follow-ups**: patients drifting from their course schedule, ranked by value at risk, one-click WhatsApp nudge
- **Billing**: outstanding vs collected, Razorpay payment links over WhatsApp, mark paid (cash / UPI / card)
- **WhatsApp**: approval queue for scheduler-drafted messages + full message log

**Integrations**
- WhatsApp Cloud API (template messages; `WHATSAPP_MODE=dry-run` logs without sending)
- Razorpay Payment Links + signed webhook
- Reminder scheduler: daily cron → tomorrow's visit reminders + follow-up drafts for approval

## Quick start

Requires Node 20+.

```bash
npm install

# Dashboard (also serves the app's API on :3000)
cp apps/dashboard/.env.example apps/dashboard/.env.local   # add SUPABASE_SECRET_KEY at minimum
npm run dev:dashboard

# Patient app
cp apps/mobile/.env.example apps/mobile/.env               # set EXPO_PUBLIC_API_URL to your computer's LAN IP:3000
npm run dev:mobile                                          # scan the QR with Expo Go
```

`npm run typecheck` checks all three packages.

See **[docs/SETUP.md](docs/SETUP.md)** for Supabase auth, staff accounts, Razorpay, WhatsApp and deployment, and
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for how the pieces fit.
