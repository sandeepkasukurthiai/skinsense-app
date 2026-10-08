import "server-only";

import type { Database } from "@skinsense/shared";
import { createClient, type User } from "@supabase/supabase-js";

import { env } from "../env";

/**
 * For API routes called by the mobile app: verifies the `Authorization: Bearer <access token>`
 * header and returns a client acting as that user (RLS applies) plus the user.
 */
export async function patientFromRequest(req: Request): Promise<
  { ok: true; user: User; db: ReturnType<typeof createClient<Database>> } | { ok: false; response: Response }
> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { ok: false, response: Response.json({ error: "Not signed in" }, { status: 401 }) };

  const db = createClient<Database>(env.supabaseUrl(), env.supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return { ok: false, response: Response.json({ error: "Session expired" }, { status: 401 }) };
  return { ok: true, user: data.user, db };
}

/** The patient row linked to this login (self, not dependants). */
export async function ownPatientId(db: Awaited<ReturnType<typeof patientFromRequest>> & { ok: true }) {
  const { data } = await db.db.from("patients").select("id").eq("auth_user_id", db.user.id).maybeSingle();
  return data?.id ?? null;
}
