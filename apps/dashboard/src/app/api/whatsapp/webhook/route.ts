import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Meta webhook verification handshake. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === env.whatsappVerifyToken()) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type StatusUpdate = { id: string; status: "sent" | "delivered" | "read" | "failed"; errors?: { title?: string }[] };

/** Delivery receipts → message_log.status. (Inbound chat replies can be added here later.) */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    entry?: { changes?: { value?: { statuses?: StatusUpdate[] } }[] }[];
  } | null;
  const statuses = body?.entry?.flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.statuses ?? []) ?? [];

  const db = createAdminClient();
  for (const s of statuses) {
    const status = s.status === "failed" ? "failed" : s.status === "sent" ? "sent" : "delivered";
    await db
      .from("message_log")
      .update({ status, response: s.errors?.[0]?.title ?? null })
      .eq("provider_msg_id", s.id);
  }
  return Response.json({ ok: true });
}
