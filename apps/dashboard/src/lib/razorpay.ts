import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { clinic, formatINR } from "@skinsense/shared";

import { env } from "./env";
import { createAdminClient } from "./supabase/admin";

function authHeader() {
  return "Basic " + Buffer.from(`${env.razorpayKeyId()}:${env.razorpayKeySecret()}`).toString("base64");
}

/**
 * Returns a Razorpay Payment Link for an unpaid invoice, creating one on first use.
 * The link id (plink_…) is stored in invoices.razorpay_order_id.
 */
export async function paymentLinkForInvoice(invoiceId: string): Promise<{ url: string; amountText: string }> {
  const db = createAdminClient();
  const { data: inv, error } = await db
    .from("invoices")
    .select("id, amount_paise, paid_at, razorpay_order_id, patients(full_name, phone)")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (inv.paid_at) throw new Error("This bill is already paid.");

  const amountText = formatINR(inv.amount_paise);

  if (inv.razorpay_order_id?.startsWith("plink_")) {
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${inv.razorpay_order_id}`, {
      headers: { Authorization: authHeader() },
    });
    const link = (await res.json()) as { short_url?: string; status?: string };
    if (res.ok && link.short_url && link.status === "created") return { url: link.short_url, amountText };
  }

  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: inv.amount_paise,
      currency: "INR",
      reference_id: inv.id,
      description: `${clinic.name} — bill`,
      customer: { name: inv.patients?.full_name, contact: inv.patients?.phone },
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: `${env.appBaseUrl()}/paid`,
      callback_method: "get",
      notes: { invoice_id: inv.id },
    }),
  });
  const link = (await res.json()) as { id?: string; short_url?: string; error?: { description: string } };
  if (!res.ok || !link.id || !link.short_url) {
    throw new Error(link.error?.description ?? "Could not create payment link");
  }
  await db.from("invoices").update({ razorpay_order_id: link.id }).eq("id", inv.id);
  return { url: link.short_url, amountText };
}

/** Verifies X-Razorpay-Signature: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env.razorpayWebhookSecret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
