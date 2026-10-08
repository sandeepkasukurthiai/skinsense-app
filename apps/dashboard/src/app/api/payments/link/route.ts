import { z } from "zod";

import { paymentLinkForInvoice } from "@/lib/razorpay";
import { patientFromRequest } from "@/lib/supabase/patient";

const Body = z.object({ invoice_id: z.string().uuid() });

/** Patient app → Razorpay payment link for one of their own invoices. */
export async function POST(req: Request) {
  const auth = await patientFromRequest(req);
  if (!auth.ok) return auth.response;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invoice_id is required" }, { status: 400 });

  // RLS: the caller can only see their own (or dependants') invoices.
  const { data: inv } = await auth.db.from("invoices").select("id").eq("id", parsed.data.invoice_id).maybeSingle();
  if (!inv) return Response.json({ error: "Bill not found" }, { status: 404 });

  try {
    const { url } = await paymentLinkForInvoice(inv.id);
    return Response.json({ url });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Payment unavailable" }, { status: 502 });
  }
}
