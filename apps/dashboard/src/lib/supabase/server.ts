import "server-only";

import type { Database } from "@skinsense/shared";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "../env";

/** Supabase client acting as the signed-in staff member (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl(), env.supabasePublishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there; proxy.ts refreshes them.
        }
      },
    },
  });
}
