import { clinic } from "@skinsense/shared";
import { Suspense } from "react";

import { requireStaff } from "@/lib/dal";

import { signOut } from "../login/actions";
import { NavLinks } from "./nav-links";

export default function ClinicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="flex w-full flex-col gap-6 bg-plum-deep p-5 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-plum font-display text-xl font-semibold text-champagne ring-1 ring-gold">
            S
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-none">{clinic.name}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#e2c79a]">Clinic dashboard</p>
          </div>
        </div>
        <Suspense fallback={<NavLinks static />}>
          <NavLinks />
        </Suspense>
        <div className="mt-auto hidden border-t border-plum-line pt-4 lg:block">
          <Suspense fallback={<p className="text-xs text-[#d9bfd2]">…</p>}>
            <StaffBadge />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-[999_1_560px] p-5 lg:p-10">{children}</main>
    </div>
  );
}

async function StaffBadge() {
  const me = await requireStaff();
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-medium">{me.name}</p>
        <p className="text-xs capitalize text-[#d9bfd2]">{me.role.replace("_", " ")}</p>
      </div>
      <form action={signOut}>
        <button type="submit" className="rounded-full border border-plum-line px-3 py-1.5 text-xs text-champagne hover:border-gold">
          Sign out
        </button>
      </form>
    </div>
  );
}
