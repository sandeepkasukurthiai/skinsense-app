# Demo accounts — eight logins

Live Supabase project `derma-app`. All are demo accounts on `.demo` addresses; the shared demo password
is kept out of the repo (ask Sandeep). Change it before anyone outside the team gets access.

| # | Role (portal) | Sign in at | Email | Lands on |
|---|---|---|---|---|
| I | Super user — Dr. Alekya Singapore (`owner`) | Dashboard → Super user | alekya@theskinsense.demo | Business numbers, course metrics, day board, team |
| II | Doctor — Dr. Kavya Rao (`doctor`) | Dashboard → Doctor | doctor@theskinsense.demo | Their own list today, course metrics |
| III | Clinical staff — Swathi R. (`staff`) | Dashboard → Clinical staff | staff@theskinsense.demo | Patients on the floor now and next |
| IV | Front desk — Reception (`front_desk`) | Dashboard → Front desk | reception@theskinsense.demo | Today's visits and takings, day board, bills to collect |
| V | Pharmacy — Pharmacy Desk (`pharmacy`) | Dashboard → Pharmacy | pharmacy@theskinsense.demo | Dispensary: prescriptions from the last 14 days |
| VI | Centre manager — Rohit M. (`centre_manager`) | Dashboard → Centre manager | manager@theskinsense.demo | Centre's day, takings, bills |
| VII | Operations head — Neha S. (`operations_head`) | Dashboard → Operations head | operations@theskinsense.demo | Month-to-date business view, read-only day board |
| VIII | Patient — Priya R. | Mobile app → "Sign in with email" | priya@patient.demo | Home: today's MNRF visit, course 4/6, regimen, bill due |

Each dashboard portal admits only its own role: signing in to the Doctor portal with the front-desk
account is refused with "This account opens the Front desk portal".

## What each role can open

Defined once in `packages/shared/src/domain.ts → roleProfiles` and enforced in the dashboard
(`requireStaff(rolesFor(...))` on every page and server action).

| Section | Super user | Doctor | Clinical staff | Front desk | Pharmacy | Centre manager | Ops head |
|---|---|---|---|---|---|---|---|
| Today | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Appointments | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| Patients | ✓ | ✓ | ✓ | ✓ | | ✓ | |
| Dispensary | ✓ | ✓ | | | ✓ | | |
| Follow-ups | ✓ | ✓ | | | | ✓ | ✓ |
| Billing | ✓ | | | ✓ | | ✓ | ✓ |
| WhatsApp | ✓ | | | ✓ | | ✓ | ✓ |

Clinical writes (notes, prescriptions, starting a course) stay limited to doctors and the super user in the
database itself. **Still to do (Sprint 1–2):** the database currently lets every active staff role *read*
all clinic tables; tightening that per role (e.g. no clinical notes for operations head) and centre-scoping
for the centre manager are the next step.

## Patients signing in by SMS

Phone + one-time code works once an SMS provider is set in Supabase → Authentication → Phone (or add test
numbers there). A patient whose mobile matches a front-desk record is linked to it automatically on first
sign-in (`claim_patient_profile`).
