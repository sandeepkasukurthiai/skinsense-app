"use client";

import { clinic, roleProfiles, STAFF_ROLES, type StaffRole } from "@skinsense/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, type CSSProperties } from "react";

import { signIn } from "./actions";

/* Brand palette only — each portal leads with a different member of it. */
const C = {
  plum: "#6E165E",
  plumDeep: "#4A0E3F",
  berry: "#702963",
  lilac: "#FDF2FF",
  blush: "#FEF7F8",
  ink: "#212121",
  gold: "#B8935A",
  goldBright: "#D8B77E",
  champagne: "#F3E3C7",
  cream: "#FFFCF7",
  noir: "#16050F",
};

type Theme = {
  /** Card surface and its text colours. */
  card: string;
  title: string;
  body: string;
  label: string;
  field: string;
  fieldLine: string;
  frame: string;
  /** The role's lead colour: emblem, divider, selected row. */
  lead: string;
  button: { bg: string; fg: string; ring: string };
  /** Tint of the light behind the card. */
  glow: string;
  motto: string;
  emblem: React.ReactNode;
};

const stroke = { fill: "none", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** One distinct identity per portal: surface, lead colour, emblem and motto. */
const themes: Record<StaffRole, Theme> = {
  owner: {
    card: `linear-gradient(160deg, ${C.plumDeep} 0%, ${C.noir} 100%)`,
    title: C.champagne,
    body: "#D9BFD2",
    label: C.goldBright,
    field: "#FFFFFF",
    fieldLine: "rgba(216,183,126,0.45)",
    frame: "rgba(216,183,126,0.7)",
    lead: C.goldBright,
    button: { bg: C.gold, fg: C.noir, ring: C.goldBright },
    glow: "rgba(184,147,90,0.28)",
    motto: "The keys to the clinic",
    emblem: <path d="M5 18h14M6 18 4.5 8.5l4.5 3.5L12 5l3 7 4.5-3.5L18 18M12 18v-3" {...stroke} />,
  },
  doctor: {
    card: C.cream,
    title: C.plumDeep,
    body: "#6B5866",
    label: "#8A6A3A",
    field: C.plumDeep,
    fieldLine: "#E7D6C0",
    frame: "rgba(110,22,94,0.35)",
    lead: C.plum,
    button: { bg: C.plum, fg: "#FFFFFF", ring: C.plumDeep },
    glow: "rgba(110,22,94,0.55)",
    motto: "Diagnosis first",
    emblem: (
      <>
        <path d="M7 3v6a4 4 0 0 0 8 0V3M11 13v2.5a4.5 4.5 0 0 0 9 0V13" {...stroke} />
        <circle cx="20" cy="11" r="2" {...stroke} />
      </>
    ),
  },
  staff: {
    card: C.blush,
    title: C.berry,
    body: "#6B5866",
    label: C.berry,
    field: C.plumDeep,
    fieldLine: "#EBD9E6",
    frame: "rgba(112,41,99,0.35)",
    lead: C.berry,
    button: { bg: C.berry, fg: "#FFFFFF", ring: C.plum },
    glow: "rgba(112,41,99,0.6)",
    motto: "Precision in every session",
    emblem: <path d="M12 3c4 4.5 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8 7.5 12 3zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" {...stroke} />,
  },
  front_desk: {
    card: C.cream,
    title: C.plumDeep,
    body: "#6B5866",
    label: "#8A6A3A",
    field: C.plumDeep,
    fieldLine: "#E7D6C0",
    frame: "rgba(184,147,90,0.6)",
    lead: C.gold,
    button: { bg: C.noir, fg: C.champagne, ring: C.gold },
    glow: "rgba(184,147,90,0.22)",
    motto: "The first welcome, the last goodbye",
    emblem: <path d="M4 18h16M6 18a6 6 0 0 1 12 0M12 9.5V8M10 8h4M3 21h18" {...stroke} />,
  },
  pharmacy: {
    card: C.lilac,
    title: C.plumDeep,
    body: "#6B5866",
    label: C.plum,
    field: C.plumDeep,
    fieldLine: "#E6CFE6",
    frame: "rgba(74,14,63,0.3)",
    lead: C.plumDeep,
    button: { bg: C.plumDeep, fg: C.lilac, ring: C.plum },
    glow: "rgba(253,242,255,0.16)",
    motto: "Exactly as prescribed",
    emblem: <path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM7 10l7 7" {...stroke} />,
  },
  centre_manager: {
    card: C.blush,
    title: C.plumDeep,
    body: "#6B5866",
    label: "#8A6A3A",
    field: C.plumDeep,
    fieldLine: "#EBD9E6",
    frame: "rgba(74,14,63,0.35)",
    lead: C.plumDeep,
    button: { bg: C.plumDeep, fg: C.champagne, ring: C.gold },
    glow: "rgba(74,14,63,0.8)",
    motto: "Banjara Hills, running beautifully",
    emblem: <path d="M3 9.5 12 4l9 5.5M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20.5h18" {...stroke} />,
  },
  operations_head: {
    card: `linear-gradient(160deg, ${C.noir} 0%, ${C.plumDeep} 100%)`,
    title: "#FFFFFF",
    body: "#D9BFD2",
    label: C.champagne,
    field: "#FFFFFF",
    fieldLine: "rgba(243,227,199,0.4)",
    frame: "rgba(243,227,199,0.55)",
    lead: C.champagne,
    button: { bg: C.champagne, fg: C.noir, ring: C.champagne },
    glow: "rgba(243,227,199,0.14)",
    motto: "The view from above",
    emblem: (
      <>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="m15.5 8.5-2 5-5 2 2-5z" {...stroke} />
      </>
    ),
  },
};

/**
 * The entrance: seven numbered staff portals on a dark, gold-ruled ground.
 * Choosing one opens its own sign-in card — its own colours, emblem and motto —
 * which admits only that role.
 */
export function Entrance() {
  const params = useSearchParams();
  const requested = params.get("portal") as StaffRole | null;
  const portal = requested && STAFF_ROLES.includes(requested) ? requested : null;
  const notStaff = params.get("error") === "not-staff";
  const theme = portal ? themes[portal] : null;

  const ground: CSSProperties = {
    background: [
      `radial-gradient(52rem 40rem at 80% 45%, ${theme?.glow ?? "rgba(110,22,94,0.25)"}, transparent 62%)`,
      "radial-gradient(60rem 40rem at 12% 12%, rgba(110,22,94,0.5), transparent 60%)",
      C.noir,
    ].join(", "),
    transition: "background 600ms ease",
  };

  return (
    <main className="min-h-screen text-white" style={ground}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-wrap">
        {/* Left: brand + portals */}
        <section className="flex min-w-0 flex-[999_1_520px] flex-col justify-between gap-12 px-6 py-10 lg:px-14 lg:py-14">
          <header className="lux-rise flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full border border-gold/70 font-display text-3xl font-semibold text-champagne">
              S
            </span>
            <div>
              <p className="font-display text-2xl font-semibold tracking-wide">{clinic.name}</p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold-bright">Banjara Hills · Hyderabad</p>
            </div>
          </header>

          <div className="lux-rise space-y-5" style={{ animationDelay: "80ms" }}>
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold-bright">The clinic, by invitation</p>
            <h1 className="max-w-xl font-display text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">
              Enter <em className="text-champagne">your</em> portal.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-[#d9bfd2]">
              Seven doors, one clinic. Each opens to exactly what that role needs — nothing more.
            </p>
          </div>

          <nav
            aria-label="Staff portals"
            className="lux-rise grid gap-px overflow-hidden rounded-2xl border border-gold/25 bg-gold/20 sm:grid-cols-2"
            style={{ animationDelay: "160ms" }}
          >
            {STAFF_ROLES.map((role) => {
              const p = roleProfiles[role];
              const t = themes[role];
              const active = role === portal;
              return (
                <Link
                  key={role}
                  href={`/login?portal=${role}`}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`group relative flex items-center gap-4 px-5 py-4 transition ${active ? "bg-plum-deep" : "bg-noir hover:bg-noir-2"}`}
                >
                  {active ? <span aria-hidden className="absolute inset-y-3 left-0 w-0.5 rounded-full" style={{ background: t.lead }} /> : null}
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-7 shrink-0 transition"
                    style={{ stroke: active ? t.lead : "rgba(184,147,90,0.7)" }}
                  >
                    {t.emblem}
                  </svg>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={`font-display text-sm ${active ? "text-gold-bright" : "text-gold/70"}`}>{p.numeral}</span>
                      <span className={`font-display text-2xl ${active ? "text-white" : "text-[#f1e4ee] group-hover:text-white"}`}>{p.portal}</span>
                    </span>
                    <span className="block text-xs leading-snug text-[#b99bb1]">{p.tagline}</span>
                  </span>
                </Link>
              );
            })}
            <div className="flex items-center gap-4 bg-noir px-5 py-4">
              <svg aria-hidden viewBox="0 0 24 24" className="size-7 shrink-0" style={{ stroke: "rgba(184,147,90,0.45)" }}>
                <circle cx="12" cy="8" r="4" {...stroke} />
                <path d="M4 20c1.5-4 5-5 8-5s6.5 1 8 5" {...stroke} />
              </svg>
              <span>
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-sm text-gold/50">VIII</span>
                  <span className="font-display text-2xl text-[#c9b3c3]">Patient</span>
                </span>
                <span className="block text-xs text-[#9e8197]">Sign in on The Skin Sensé app</span>
              </span>
            </div>
          </nav>

          <p className="text-xs text-[#9e8197]">{clinic.address}</p>
        </section>

        {/* Right: the chosen portal's own sign-in card */}
        <section
          className={`flex min-w-0 flex-[1_1_420px] items-center justify-center px-6 pb-14 lg:py-14 lg:pr-14 lg:pl-0 ${
            portal ? "order-first pt-8 lg:order-none lg:pt-14" : ""
          }`}
        >
          {portal ? (
            <PortalCard key={portal} portal={portal} />
          ) : (
            <div className="lux-rise max-w-sm space-y-4 text-center" style={{ animationDelay: "240ms" }}>
              <p className="font-display text-8xl leading-none text-gold/40">S</p>
              <p className="font-display text-3xl text-champagne">Choose your portal</p>
              <p className="text-sm text-[#b99bb1]">
                {notStaff ? "That account isn’t clinic staff. Patients sign in on The Skin Sensé app." : "Select your role to continue."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PortalCard({ portal }: { portal: StaffRole }) {
  const p = roleProfiles[portal];
  const t = themes[portal];
  const [state, action, pending] = useActionState(signIn, { error: null });

  const fieldStyle: CSSProperties = { color: t.field, borderBottomColor: t.fieldLine };

  return (
    <div
      className="lux-rise relative w-full max-w-md overflow-hidden rounded-[28px] px-8 py-12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] sm:px-12"
      style={{ background: t.card }}
    >
      {/* Foil frame and a large watermark numeral, in the portal's own colours */}
      <span aria-hidden className="pointer-events-none absolute inset-[10px] rounded-[20px] border" style={{ borderColor: t.frame }} />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[180px] italic leading-none"
        style={{ color: t.lead, opacity: 0.08 }}
      >
        {p.numeral}
      </span>

      <div className="relative space-y-3 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full border" style={{ borderColor: t.frame }}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-8" style={{ stroke: t.lead }}>
            {t.emblem}
          </svg>
        </span>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: t.label }}>
          {p.numeral} · {p.portal} portal
        </p>
        <h2 className="font-display text-4xl font-medium" style={{ color: t.title }}>
          Welcome back
        </h2>
        <p className="font-display text-lg italic" style={{ color: t.lead }}>
          {t.motto}
        </p>
        <p className="text-sm" style={{ color: t.body }}>
          {p.tagline}
        </p>
      </div>

      <div className="relative mx-auto my-8 h-px w-16" style={{ background: t.lead, opacity: 0.6 }} />

      <form action={action} className="relative space-y-7">
        <input type="hidden" name="portal" value={portal} />
        <div>
          <label htmlFor="email" className="block text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: t.label }}>
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="lux-field" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="password" className="block text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: t.label }}>
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="lux-field" style={fieldStyle} />
        </div>
        {state.error ? (
          <p role="alert" className="rounded-xl bg-[#fbe9e8] px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-full px-6 text-xs font-semibold uppercase tracking-[0.28em] transition hover:brightness-110 disabled:opacity-60"
          style={{ background: t.button.bg, color: t.button.fg, boxShadow: `0 0 0 1px ${t.button.ring}` }}
        >
          {pending ? "Opening…" : `Enter as ${p.portal}`}
        </button>
      </form>
      <p className="relative mt-8 text-center text-xs" style={{ color: t.body }}>
        Not your portal?{" "}
        <Link href="/login" scroll={false} className="font-medium underline-offset-4 hover:underline" style={{ color: t.lead }}>
          See all seven
        </Link>
      </p>
    </div>
  );
}
