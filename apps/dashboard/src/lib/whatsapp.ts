import "server-only";

import { whatsappTemplates, type TemplateKey } from "@skinsense/shared";

import { env } from "./env";
import { createAdminClient } from "./supabase/admin";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0";

type Recipient = { id: string; phone: string };

/**
 * Logs a WhatsApp template message in message_log and sends it via the
 * WhatsApp Cloud API. With WHATSAPP_MODE != "live" it only logs (dry run).
 * `requireApproval` parks it as pending_approval for the front desk instead of sending.
 */
export async function sendTemplate(
  to: Recipient,
  key: TemplateKey,
  vars: Record<string, string>,
  opts: { requireApproval?: boolean } = {},
) {
  const db = createAdminClient();
  const tpl = whatsappTemplates[key];
  const { data: row, error } = await db
    .from("message_log")
    .insert({
      patient_id: to.id,
      channel: "whatsapp",
      template: tpl.name,
      variables: vars,
      body: tpl.preview(vars),
      status: opts.requireApproval ? "pending_approval" : "queued",
    })
    .select("id")
    .single();
  if (error) throw error;
  if (opts.requireApproval) return { id: row.id, status: "pending_approval" as const };
  return deliver(row.id);
}

/** Sends an already-logged message (queued, or just approved). */
export async function deliver(messageId: string) {
  const db = createAdminClient();
  const { data: msg, error } = await db
    .from("message_log")
    .select("id, template, variables, patients(phone)")
    .eq("id", messageId)
    .single();
  if (error) throw error;

  if (!env.whatsappLive()) {
    await db.from("message_log").update({ status: "queued", response: "dry-run: not sent" }).eq("id", messageId);
    return { id: messageId, status: "queued" as const };
  }

  const key = (Object.keys(whatsappTemplates) as TemplateKey[]).find((k) => whatsappTemplates[k].name === msg.template);
  const vars = (msg.variables ?? {}) as Record<string, string>;
  const params = key ? whatsappTemplates[key].params(vars) : [];
  const phone = (msg.patients?.phone ?? "").replace(/\D/g, "");

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${env.whatsappPhoneNumberId()}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.whatsappAccessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: msg.template,
        language: { code: "en" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message: string } };

  if (!res.ok) {
    await db
      .from("message_log")
      .update({ status: "failed", response: json.error?.message ?? `HTTP ${res.status}` })
      .eq("id", messageId);
    return { id: messageId, status: "failed" as const };
  }
  await db
    .from("message_log")
    .update({ status: "sent", sent_at: new Date().toISOString(), provider_msg_id: json.messages?.[0]?.id ?? null })
    .eq("id", messageId);
  return { id: messageId, status: "sent" as const };
}
