# Clinic dashboard — The Skin Sensé

Next.js 16 (App Router, Cache Components) · Tailwind 4 · Supabase.

```bash
cp .env.example .env.local
npm run dev              # from repo root: npm run dev:dashboard
```

- `src/app/(clinic)/` — staff pages: Today, Appointments, Patients, Follow-ups, Billing, WhatsApp; `actions.ts` holds server actions
- `src/app/api/` — routes for the patient app, Razorpay and WhatsApp webhooks, and the reminder cron
- `src/lib/` — Supabase clients (`server`, `admin`, `patient` bearer auth), `dal.ts` (staff gate), `slots`, `razorpay`, `whatsapp`
- `src/proxy.ts` — session refresh + sign-in redirect

Read `AGENTS.md`: this Next.js version differs from older docs; the bundled guides are in `node_modules/next/dist/docs/`.
