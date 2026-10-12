import "server-only";

import { isStaffRole, roleProfiles, STAFF_ROLES, type NavKey, type StaffRole } from "@skinsense/shared";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "./supabase/server";

export type StaffUser = { id: string; name: string; role: StaffRole };

const loadStaff = cache(async (): Promise<StaffUser | "signed-out" | "not-staff"> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "signed-out";

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, role, active")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!staff || !staff.active || !isStaffRole(staff.role)) return "not-staff";
  return { id: staff.id, name: staff.full_name, role: staff.role };
});

/**
 * Data access layer: the signed-in staff member, or a redirect to /login.
 * Call at the top of every server page section and server action.
 * `roles` limits a page or action to some roles; others are sent to their home.
 */
export async function requireStaff(roles: StaffRole[] = STAFF_ROLES): Promise<StaffUser> {
  const me = await loadStaff();
  if (me === "signed-out") redirect("/login");
  if (me === "not-staff") redirect("/login?error=not-staff");
  if (!roles.includes(me.role)) redirect("/?error=forbidden");
  return me;
}

/** Roles allowed to open a dashboard section — the inverse of roleProfiles[role].nav. */
export function rolesFor(section: NavKey): StaffRole[] {
  return STAFF_ROLES.filter((r) => roleProfiles[r].nav.includes(section));
}
