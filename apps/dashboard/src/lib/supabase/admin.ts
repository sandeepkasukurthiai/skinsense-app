import "server-only";

import type { Database } from "@skinsense/shared";
import { createClient } from "@supabase/supabase-js";

import { env } from "../env";

/**
 * Service client — BYPASSES RLS. Only for server code that has already
 * authorised the caller (patient self-registration, slot booking, webhooks, cron).
 */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
