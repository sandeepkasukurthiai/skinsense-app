"use server";

import {
  CLINICIAN_ROLES,
  invoiceTotal,
  nextApptStatus,
  toE164India,
  whenText,
  type ApptStatus,
  type InvoiceLine,
  type RxItem,
} from "@skinsense/shared";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/lib/dal";
import { paymentLinkForInvoice } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { deliver, sendTemplate } from "@/lib/whatsapp";

export type ActionState = { error: string | null; ok?: string | null };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/* ---------- Day board ---------- */

export async function advanceAppointment(formData: FormData) {
  await requireStaff();
  const id = str(formData, "id");
  const to = str(formData, "to") as ApptStatus;
  const supabase = await createClient();
  const { data: appt } = await supabase.from("appointments").select("status").eq("id", id).single();
  const allowed = appt && (nextApptStatus[appt.status] === to || (to === "no_show" && appt.status === "booked") || to === "cancelled");
  if (!allowed) return;
  await supabase.from("appointments").update({ status: to }).eq("id", id);
  refresh();
}

/* ---------- Patients ---------- */

const PatientInput = z.object({
  full_name: z.string().min(2, "Enter the patient’s full name"),
  phone: z.string(),
  dob: z.string().optional(),
  sex: z.string().optional(),
  presenting_concern: z.string().optional(),
  allergies: z.string().optional(),
});

export async function createPatient(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = PatientInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const phone = toE164India(parsed.data.phone);
  if (!phone) return { error: "Enter a valid 10-digit mobile number" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name: parsed.data.full_name,
      phone,
      dob: parsed.data.dob || null,
      sex: parsed.data.sex || null,
      presenting_concern: parsed.data.presenting_concern || null,
      allergies: parsed.data.allergies || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message.includes("duplicate") ? "A patient with this phone already exists" : error.message };
  redirect(`/patients/${data.id}`);
}

export async function recordConsent(formData: FormData) {
  const me = await requireStaff();
  const supabase = await createClient();
  await supabase.from("consents").insert({
    patient_id: str(formData, "patient_id"),
    kind: str(formData, "kind") as "clinical" | "telemed" | "marketing" | "referral",
    granted_at: new Date().toISOString(),
    granted_by_staff_id: me.id,
    evidence: { method: "front_desk_attested" },
  });
  refresh();
}

/* ---------- Appointments ---------- */

export async function createAppointment(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const supabase = await createClient();
  const patient_id = str(formData, "patient_id");
  const service_id = str(formData, "service_id");
  const provider_id = str(formData, "provider_id");
  const date = str(formData, "date");
  const time = str(formData, "time");
  const source = (str(formData, "source") || "phone") as "phone" | "walk_in" | "whatsapp" | "app";
  if (!patient_id || !service_id || !provider_id || !date || !time) return { error: "Fill in every field" };

  const { data: svc } = await supabase.from("services").select("duration_min").eq("id", service_id).single();
  const starts = new Date(`${date}T${time}:00+05:30`);
  const ends = new Date(starts.getTime() + (svc?.duration_min ?? 30) * 60_000);

  const { data: clash } = await supabase
    .from("appointments")
    .select("id")
    .eq("provider_id", provider_id)
    .not("status", "in", "(cancelled,no_show)")
    .lt("starts_at", ends.toISOString())
    .gt("ends_at", starts.toISOString())
    .limit(1);
  if (clash?.length) return { error: "The doctor already has a visit at that time" };

  const { error } = await supabase.from("appointments").insert({
    patient_id,
    service_id,
    provider_id,
    source,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
  });
  if (error) return { error: error.message };

  const { data: p } = await supabase.from("patients").select("id, phone, full_name").eq("id", patient_id).single();
  if (p && formData.get("notify") === "on") {
    await sendTemplate(p, "appt_confirmed", { name: p.full_name.split(" ")[0], when: whenText(starts.toISOString()) }).catch(() => undefined);
  }
  refresh();
  return { error: null, ok: "Appointment booked" };
}

/* ---------- Treatment courses ---------- */

export async function startPlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireStaff(CLINICIAN_ROLES);
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_plan_from_protocol", {
    p_patient: str(formData, "patient_id"),
    p_protocol: str(formData, "protocol_id"),
    p_provider: me.id,
    p_start: str(formData, "start") || undefined,
  });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: "Course started" };
}

export async function recordSession(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const supabase = await createClient();
  const plan_session_id = str(formData, "plan_session_id");
  const { error } = await supabase.from("session_records").insert({
    plan_session_id,
    recorded_by: me.id,
    device: str(formData, "device") || null,
    fluence: str(formData, "fluence") || null,
    pulse_width: str(formData, "pulse_width") || null,
    passes: Number(str(formData, "passes")) || null,
    endpoint: str(formData, "endpoint") || null,
    adverse_event: str(formData, "adverse_event") || null,
    pih_watch: formData.get("pih_watch") === "on",
  });
  if (error) return { error: error.message };
  await supabase.from("plan_sessions").update({ performed_at: new Date().toISOString() }).eq("id", plan_session_id);
  refresh();
  return { error: null, ok: "Session recorded" };
}

/* ---------- Clinical notes & prescriptions (clinicians) ---------- */

export async function addNote(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireStaff(CLINICIAN_ROLES);
  const text = str(formData, "free_text");
  if (!text) return { error: "Write the note first" };
  const supabase = await createClient();
  const { error } = await supabase.from("clinical_notes").insert({
    patient_id: str(formData, "patient_id"),
    author_id: me.id,
    free_text: text,
    template: str(formData, "template") || null,
    amends_note_id: str(formData, "amends_note_id") || null,
  });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: "Note saved" };
}

export async function addPrescription(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireStaff(CLINICIAN_ROLES);
  const lines = str(formData, "items")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { error: "Add at least one medicine" };

  // One medicine per line: drug | strength | dose | frequency | duration | instructions
  const items: RxItem[] = lines.map((l) => {
    const [drug, strength, dose, frequency, duration, instructions] = l.split("|").map((x) => x?.trim() || undefined);
    return { drug: drug ?? l, strength, dose, frequency, duration, instructions };
  });
  const days = Number(str(formData, "valid_days")) || 30;

  const supabase = await createClient();
  const { error } = await supabase.from("prescriptions").insert({
    patient_id: str(formData, "patient_id"),
    provider_id: me.id,
    items,
    telemedicine: formData.get("telemedicine") === "on",
    valid_to: new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10),
  });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: "Prescription signed" };
}

/* ---------- Billing ---------- */

export async function createInvoice(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const lines: InvoiceLine[] = str(formData, "lines")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      // "Label | qty | price in ₹"
      const [label, qty, price] = l.split("|").map((x) => x.trim());
      return { label, qty: Number(qty) || 1, unit_paise: Math.round(Number(price) * 100) };
    })
    .filter((l) => l.label && l.unit_paise > 0);
  if (!lines.length) return { error: "Add at least one line: Label | qty | price" };

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").insert({
    patient_id: str(formData, "patient_id"),
    plan_id: str(formData, "plan_id") || null,
    lines,
    amount_paise: invoiceTotal(lines),
  });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: "Bill created" };
}

export async function markInvoicePaid(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ paid_at: new Date().toISOString(), method: str(formData, "method") || "cash" })
    .eq("id", str(formData, "id"))
    .is("paid_at", null);
  refresh();
}

export async function sendPaymentLink(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const invoiceId = str(formData, "id");
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("id, patients(id, phone, full_name)").eq("id", invoiceId).single();
  if (!inv?.patients) return { error: "Bill not found" };
  try {
    const { url, amountText } = await paymentLinkForInvoice(invoiceId);
    await sendTemplate(inv.patients, "payment_link", { name: inv.patients.full_name.split(" ")[0], amount: amountText, link: url });
    refresh();
    return { error: null, ok: "Payment link sent on WhatsApp" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the payment link" };
  }
}

/* ---------- WhatsApp ---------- */

export async function approveMessage(formData: FormData) {
  const me = await requireStaff();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase
    .from("message_log")
    .update({ status: "queued", approved_by: me.id, approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending_approval")
    .select("id")
    .maybeSingle();
  if (data) await deliver(data.id);
  refresh();
}

export async function discardMessage(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("message_log").update({ status: "cancelled" }).eq("id", str(formData, "id")).eq("status", "pending_approval");
  refresh();
}

export async function nudgeDrift(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const { data: p } = await supabase.from("patients").select("id, phone, full_name").eq("id", str(formData, "patient_id")).single();
  if (!p) return;
  await sendTemplate(p, "session_due", {
    name: p.full_name.split(" ")[0],
    session: str(formData, "session"),
    protocol: str(formData, "protocol"),
  });
  refresh();
}
