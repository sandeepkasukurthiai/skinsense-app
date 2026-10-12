"use client";

import { navItems, type NavKey } from "@skinsense/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** The role's sections. `static` renders without the active state (Suspense fallback). */
export function NavLinks(props: { items: NavKey[]; static?: boolean }) {
  return props.static ? <Links items={props.items} path={null} /> : <ActiveLinks items={props.items} />;
}

function ActiveLinks({ items }: { items: NavKey[] }) {
  return <Links items={items} path={usePathname()} />;
}

function Links({ items, path }: { items: NavKey[]; path: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1 lg:flex-col">
      {items.map((key) => {
        const l = navItems[key];
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
