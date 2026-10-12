"use server";

import { isStaffRole, roleProfiles, STAFF_ROLES, type StaffRole } from "@skinsense/shared";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Signs in through a role's portal. Each portal admits only its own role, so a
 * front-desk account cannot open the Doctor portal (and vice versa).
 */
export async function signIn(_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const portal = String(formData.get("portal") ?? "") as StaffRole;
  if (!email || !password) return { error: "Enter your email and password." };
  if (!STAFF_ROLES.includes(portal)) return { error: "Choose your portal first." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password." };

  const { data: staff } = await supabase.from("staff").select("role, active").eq("id", data.user.id).maybeSingle();
  if (!staff?.active || !isStaffRole(staff.role)) {
    await supabase.auth.signOut();
    return { error: "This account isn’t set up as clinic staff. Patients sign in on The Skin Sensé app." };
  }
  if (staff.role !== portal) {
    await supabase.auth.signOut();
    return { error: `This account opens the ${roleProfiles[staff.role].portal} portal. Please sign in there.` };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
