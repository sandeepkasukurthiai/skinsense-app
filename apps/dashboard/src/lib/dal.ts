import "server-only";

import { STAFF_ROLES, type AppRole } from "@skinsense/shared";
import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";

export type StaffUser = { id: string; name: string; role: AppRole };

/**
 * Data access layer: the signed-in staff member, or a redirect to /login.
 * Call at the top of every server page section and server action.
 */
export async function requireStaff(roles: AppRole[] = STAFF_ROLES): Promise<StaffUser> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, role, active")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!staff || !staff.active || !STAFF_ROLES.includes(staff.role)) redirect("/login?error=not-staff");
  if (!roles.includes(staff.role)) redirect("/?error=forbidden");

  return { id: staff.id, name: staff.full_name, role: staff.role };
}
