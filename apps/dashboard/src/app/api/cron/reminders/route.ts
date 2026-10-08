import { whenText } from "@skinsense/shared";

import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/whatsapp";

/**
 * Daily reminder scheduler (Vercel Cron, see vercel.json — 6:30 PM IST).
 * 1. WhatsApp reminder for every visit booked for tomorrow.
 * 2. Drafts a "session due" nudge for each overdue course (v_drift) — parked
 *    as pending_approval so the front desk reviews before anything goes out.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = createAdminClient();

  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + 86_400_000));
  const from = new Date(`${tomorrow}T00:00:00+05:30`).toISOString();
  const to = new Date(`${tomorrow}T23:59:59+05:30`).toISOString();

  const { data: appts } = await db
    .from("appointments")
    .select("id, starts_at, patients(id, phone, full_name)")
    .eq("status", "booked")
    .gte("starts_at", from)
    .lte("starts_at", to);

  let reminders = 0;
  for (const a of appts ?? []) {
    if (!a.patients) continue;
    await sendTemplate(a.patients, "appt_reminder", { name: a.patients.full_name.split(" ")[0], when: whenText(a.starts_at) })
      .then(() => reminders++)
      .catch(() => undefined);
  }

  // Avoid re-drafting the same nudge within a week.
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: recent } = await db
    .from("message_log")
    .select("patient_id")
    .eq("template", "skinsense_session_due")
    .gte("created_at", weekAgo);
  const recentlyNudged = new Set((recent ?? []).map((r) => r.patient_id));

  const { data: drift } = await db.from("v_drift").select("*").order("rank_score", { ascending: false }).limit(50);
  let drafts = 0;
  for (const d of drift ?? []) {
    if (!d.patient_id || !d.phone || !d.full_name || recentlyNudged.has(d.patient_id)) continue;
    await sendTemplate(
      { id: d.patient_id, phone: d.phone },
      "session_due",
      { name: d.full_name.split(" ")[0], session: String(d.session_seq ?? ""), protocol: d.protocol_name ?? "treatment" },
      { requireApproval: true },
    )
      .then(() => drafts++)
      .catch(() => undefined);
  }

  return Response.json({ reminders, drafts_for_approval: drafts });
}
