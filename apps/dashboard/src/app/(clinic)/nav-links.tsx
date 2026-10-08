"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/appointments", label: "Appointments" },
  { href: "/patients", label: "Patients" },
  { href: "/follow-ups", label: "Follow-ups" },
  { href: "/billing", label: "Billing" },
  { href: "/messages", label: "WhatsApp" },
] as const;

/** `static` renders without the active state (Suspense fallback for the prerendered shell). */
export function NavLinks(props: { static?: boolean }) {
  return props.static ? <Links path={null} /> : <ActiveLinks />;
}

function ActiveLinks() {
  return <Links path={usePathname()} />;
}

function Links({ path }: { path: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1 lg:flex-col">
      {LINKS.map((l) => {
        const active = path !== null && (l.href === "/" ? path === "/" : path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-3 py-2.5 text-sm transition ${
              active ? "bg-plum font-semibold text-white" : "text-[#ead3e3] hover:bg-plum/60 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
