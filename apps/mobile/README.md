# Patient app — The Skin Sensé

Expo SDK 57 · Expo Router · Supabase.

```bash
cp .env.example .env     # EXPO_PUBLIC_API_URL → your computer's LAN IP:3000 when testing on a phone
npm run start            # from repo root: npm run dev:mobile
```

- `src/app/` — screens (`sign-in`, `onboarding`, `(tabs)/index|treatments|book|journey|profile`, `appointments/[id]`, `prescriptions`, `payments`)
- `src/lib/` — Supabase client, session provider, queries, API client
- `src/ui/` — theme, text styles, icons, shared components

Read `AGENTS.md` before changing Expo APIs; always add native packages with `npx expo install`.
