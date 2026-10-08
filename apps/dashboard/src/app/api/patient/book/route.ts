import { whenText } from "@skinsense/shared";
import { z } from "zod";

import { openSlots } from "@/lib/slots";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownPatientId, patientFromRequest } from "@/lib/supabase/patient";
import { sendTemplate } from "@/lib/whatsapp";

const Body = z.object({
  service_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  starts_at: z.string().datetime({ offset: true }),
  patient_id: z.string().uuid().optional(), // a dependant (child) the caller manages
});

/** Books a slot after re-checking it is still free. */
export async function POST(req: Request) {
  const auth = await patientFromRequest(req);
  if (!auth.ok) return auth.response;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid booking request" }, { status: 400 });
  const { service_id, provider_id, starts_at } = parsed.data;

  // Who is this booking for? Self by default; a dependant only if RLS lets the caller see them.
  let patientId = await ownPatientId(auth);
  if (parsed.data.patient_id) {
    const { data } = await auth.db.from("patients").select("id").eq("id", parsed.data.patient_id).maybeSingle();
    patientId = data?.id ?? null;
  }
  if (!patientId) return Response.json({ error: "Finish your profile before booking." }, { status: 400 });

  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(starts_at));
  const slot = (await openSlots(service_id, ymd)).find(
    (s) => s.provider_id === provider_id && new Date(s.starts_at).getTime() === new Date(starts_at).getTime(),
  );
  if (!slot) return Response.json({ error: "That time was just taken — please pick another." }, { status: 409 });

  const admin = createAdminClient();
  const { data: appt, error } = await admin
    .from("appointments")
    .insert({
      patient_id: patientId,
      provider_id,
      service_id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      source: "app",
      status: "booked",
    })
    .select("id")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: patient } = await admin.from("patients").select("id, phone, full_name").eq("id", patientId).single();
  if (patient) {
    await sendTemplate(patient, "appt_confirmed", {
      name: patient.full_name.split(" ")[0],
      when: whenText(slot.starts_at),
    }).catch(() => undefined); // never fail a booking because a message failed
  }

  return Response.json({ appointment_id: appt.id });
}
