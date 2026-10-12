"use client";

import { clinic, roleProfiles, STAFF_ROLES, type StaffRole } from "@skinsense/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signIn } from "./actions";

/**
 * The entrance: seven numbered staff portals on a dark, gold-ruled ground.
 * Choosing one opens its own sign-in card, which admits only that role.
 */
export function Entrance() {
  const params = useSearchParams();
  const requested = params.get("portal") as StaffRole | null;
  const portal = requested && STAFF_ROLES.includes(requested) ? requested : null;
  const notStaff = params.get("error") === "not-staff";

  return (
    <main className="lux-glow min-h-screen text-white">
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

          <nav aria-label="Staff portals" className="lux-rise grid gap-px overflow-hidden rounded-2xl border border-gold/25 bg-gold/20 sm:grid-cols-2" style={{ animationDelay: "160ms" }}>
            {STAFF_ROLES.map((role) => {
              const p = roleProfiles[role];
              const active = role === portal;
              return (
                <Link
                  key={role}
                  href={`/login?portal=${role}`}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`group flex items-baseline gap-4 px-5 py-4 transition ${
                    active ? "bg-plum-deep" : "bg-noir hover:bg-noir-2"
                  }`}
                >
                  <span className={`w-8 shrink-0 font-display text-lg ${active ? "text-gold-bright" : "text-gold/70 group-hover:text-gold-bright"}`}>
                    {p.numeral}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-display text-2xl ${active ? "text-white" : "text-[#f1e4ee] group-hover:text-white"}`}>
                      {p.portal}
                    </span>
                    <span className="block text-xs leading-snug text-[#b99bb1]">{p.tagline}</span>
                  </span>
                </Link>
              );
            })}
            <div className="flex items-baseline gap-4 bg-noir px-5 py-4">
              <span className="w-8 shrink-0 font-display text-lg text-gold/50">VIII</span>
              <span>
                <span className="block font-display text-2xl text-[#c9b3c3]">Patient</span>
                <span className="block text-xs text-[#9e8197]">Sign in on The Skin Sensé app</span>
              </span>
            </div>
          </nav>

          <p className="text-xs text-[#9e8197]">{clinic.address}</p>
        </section>

        {/* Right: the chosen portal's sign-in card */}
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
  const [state, action, pending] = useActionState(signIn, { error: null });

  return (
    <div className="lux-rise lux-frame w-full max-w-md rounded-[28px] bg-cream px-8 py-12 text-ink shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] sm:px-12">
      <div className="space-y-2 text-center">
        <p className="font-display text-lg text-gold">{p.numeral}</p>
        <p className="lux-label">{p.portal} portal</p>
        <h2 className="font-display text-4xl font-medium text-plum-deep">Welcome back</h2>
        <p className="text-sm text-muted">{p.tagline}</p>
      </div>
      <div className="mx-auto my-8 h-px w-16 bg-gold/60" />
      <form action={action} className="space-y-7">
        <input type="hidden" name="portal" value={portal} />
        <div>
          <label htmlFor="email" className="lux-label">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="lux-field" />
        </div>
        <div>
          <label htmlFor="password" className="lux-label">
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="lux-field" />
        </div>
        {state.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <button type="submit" className="lux-btn" disabled={pending}>
          {pending ? "Opening…" : "Enter the portal"}
        </button>
      </form>
      <p className="mt-8 text-center text-xs text-muted">
        Not your portal?{" "}
        <Link href="/login" scroll={false} className="font-medium">
          See all seven
        </Link>
      </p>
    </div>
  );
}
