import { verifyWebhook } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

type LinkPaidEvent = {
  event: string;
  payload: {
    payment_link?: { entity: { id: string; reference_id?: string; notes?: { invoice_id?: string } } };
    payment?: { entity: { id: string; method?: string } };
  };
};

/** Razorpay webhook (subscribe to `payment_link.paid`). Marks the invoice paid. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature"))) {
    return Response.json({ error: "Bad signature" }, { status: 401 });
  }

  const evt = JSON.parse(raw) as LinkPaidEvent;
  if (evt.event !== "payment_link.paid") return Response.json({ ok: true, ignored: evt.event });

  const link = evt.payload.payment_link?.entity;
  const payment = evt.payload.payment?.entity;
  const invoiceId = link?.notes?.invoice_id ?? link?.reference_id;
  if (!invoiceId || !payment) return Response.json({ error: "Missing invoice reference" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db
    .from("invoices")
    .update({
      paid_at: new Date().toISOString(),
      razorpay_payment_id: payment.id,
      method: payment.method ?? "razorpay",
    })
    .eq("id", invoiceId)
    .is("paid_at", null); // idempotent: Razorpay may retry
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await db.from("audit_log").insert({ action: "invoice.paid", entity: "invoices", entity_id: invoiceId, meta: { payment_id: payment.id } });
  return Response.json({ ok: true });
}
