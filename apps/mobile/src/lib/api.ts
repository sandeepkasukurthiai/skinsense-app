import { supabase } from "./supabase";

/**
 * Base URL of the clinic dashboard, which serves the few server-only routes the app
 * needs (Razorpay payment links). Everything else goes straight to Supabase.
 */
const base = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Calls a dashboard API route with the signed-in patient's access token. */
export async function api<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(json.error ?? `Request failed (${res.status})`, res.status);
  return json;
}

/** Postgres errors from RPCs carry the human message in `message`. */
export function rpcMessage(error: { message?: string } | null, fallback: string) {
  return error?.message?.replace(/^.*?:\s*/, "") || fallback;
}

export type Slot = { starts_at: string; ends_at: string; provider_id: string; provider_name: string };
