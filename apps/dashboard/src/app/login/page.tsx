import { clinic } from "@skinsense/shared";
import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-plum-deep p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-24 font-display text-[460px] italic leading-none text-[#5c1a50]">
          S
        </span>
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-plum font-display text-2xl font-semibold text-champagne ring-1 ring-gold">
            S
          </span>
          <span className="font-display text-2xl font-semibold">{clinic.name}</span>
        </div>
        <div className="relative max-w-md space-y-4">
          <p className="eyebrow text-[#e2c79a]">Clinic dashboard</p>
          <h1 className="font-display text-5xl leading-tight">
            Every patient, every course, <em className="text-champagne">on time.</em>
          </h1>
          <p className="text-sm leading-relaxed text-[#ead3e3]">
            Today’s board, follow-ups that are drifting, prescriptions, bills and WhatsApp — in one place for Dr. Alekya’s team.
          </p>
        </div>
        <p className="relative text-xs text-[#d9bfd2]">{clinic.address}</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <p className="eyebrow">Staff sign-in</p>
            <h2 className="h-display text-4xl">Welcome back</h2>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
