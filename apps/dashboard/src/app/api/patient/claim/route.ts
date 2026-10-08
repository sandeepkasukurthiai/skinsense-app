import { toE164India } from "@skinsense/shared";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { patientFromRequest } from "@/lib/supabase/patient";

const Body = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  presenting_concern: z.string().max(200).nullable().optional(),
});

/**
 * Links the signed-in phone number to its clinic record.
 * - An existing patient with this phone (registered at the front desk) is linked.
 * - Otherwise, if a name is supplied, a new patient record is created.
 * Patients cannot insert into `patients` under RLS, so this runs with the service key
 * after verifying the caller's phone-OTP session.
 */
export async function POST(req: Request) {
  const auth = await patientFromRequest(req);
  if (!auth.ok) return auth.response;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Please check your details." }, { status: 400 });

  const phone = auth.user.phone ? toE164India(auth.user.phone) : null;
  if (!phone) return Response.json({ error: "Sign in with a verified mobile number." }, { status: 400 });

  const admin = createAdminClient();

  const { data: linked } = await admin.from("patients").select("*").eq("auth_user_id", auth.user.id).maybeSingle();
  if (linked) return Response.json({ patient: linked });

  // Adult record on this phone (minors share a guardian's phone and are linked through the guardian).
  const { data: existing } = await admin
    .from("patients")
    .select("*")
    .eq("phone", phone)
    .is("guardian_patient_id", null)
    .is("auth_user_id", null)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from("patients")
      .update({ auth_user_id: auth.user.id })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ patient: data });
  }

  if (!parsed.data.full_name) return Response.json({ patient: null });

  const { data, error } = await admin
    .from("patients")
    .insert({
      full_name: parsed.data.full_name,
      phone,
      dob: parsed.data.dob ?? null,
      presenting_concern: parsed.data.presenting_concern ?? null,
      auth_user_id: auth.user.id,
    })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ patient: data });
}
