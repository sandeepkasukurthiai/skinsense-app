// Live check against Supabase: signs in as staff and as a patient, reads and writes
// through RLS exactly as the apps do. Run: node scripts/check-connection.mjs
// Needs SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, STAFF_EMAIL, PATIENT_EMAIL, DEMO_PASSWORD.
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key, STAFF_EMAIL, PATIENT_EMAIL, DEMO_PASSWORD } = process.env;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY");

let failures = 0;
const ok = (label, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
};
const client = () => createClient(url, key, { auth: { persistSession: false } });

// Anonymous: RLS must hide everything.
{
  const anon = client();
  const { data, error } = await anon.from("patients").select("id");
  ok("Supabase reachable", !error, error?.message);
  ok("anonymous visitor sees no patients", !error && (data ?? []).length === 0);
}

// Staff
{
  const db = client();
  const { error } = await db.auth.signInWithPassword({ email: STAFF_EMAIL, password: DEMO_PASSWORD });
  ok("staff sign-in", !error, error?.message);
  const { data: me } = await db.from("staff").select("full_name, role").eq("id", (await db.auth.getUser()).data.user.id).single();
  ok("staff record found", !!me, me ? `${me.full_name} (${me.role})` : "");
  const { data: patients } = await db.from("patients").select("id");
  ok("staff reads all patients", (patients ?? []).length > 1, `${patients?.length} patients`);
  const { data: board, error: bErr } = await db.from("v_day_board").select("*").limit(50);
  ok("staff reads day board view", !bErr, `${board?.length ?? 0} rows`);
  // Write: add a note-free, reversible change — mark a consent then withdraw it.
  const pid = patients[0].id;
  const { data: c, error: cErr } = await db
    .from("consents")
    .insert({ patient_id: pid, kind: "marketing", granted_at: new Date().toISOString(), evidence: { method: "connection_check" } })
    .select("id")
    .single();
  ok("staff write (insert consent)", !cErr, cErr?.message);
  if (c) {
    const { error: wErr } = await db.from("consents").update({ withdrawn_at: new Date().toISOString() }).eq("id", c.id);
    ok("staff write (update consent)", !wErr, wErr?.message);
  }
}

// Patient
{
  const db = client();
  const { error } = await db.auth.signInWithPassword({ email: PATIENT_EMAIL, password: DEMO_PASSWORD });
  ok("patient sign-in", !error, error?.message);
  const { data: self, error: claimErr } = await db.rpc("claim_patient_profile");
  ok("patient profile linked", !claimErr && !!self?.id, self?.full_name ?? claimErr?.message);
  const { data: visible } = await db.from("patients").select("id");
  ok("patient sees only own record(s)", (visible ?? []).length === 1, `${visible?.length} visible`);
  const { data: staffRows } = await db.from("staff").select("id");
  ok("patient cannot read staff table", (staffRows ?? []).length === 0);
  const { data: docs } = await db.from("v_clinicians").select("full_name");
  ok("patient sees doctor names", (docs ?? []).length > 0, docs?.map((d) => d.full_name).join(", "));
  const { data: services } = await db.from("services").select("id, name").eq("active", true);
  ok("patient reads treatments", (services ?? []).length > 0, `${services?.length} services`);

  // Find the next weekday and book, then cancel (write path the app uses).
  const d = new Date(Date.now() + 2 * 86_400_000);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  const ymd = d.toISOString().slice(0, 10);
  const svc = services.find((s) => s.name.startsWith("New consultation")) ?? services[0];
  const { data: slots, error: sErr } = await db.rpc("open_slots", { p_service: svc.id, p_date: ymd });
  ok("open slots RPC", !sErr && (slots ?? []).length > 0, sErr?.message ?? `${slots?.length} slots on ${ymd}`);
  if (slots?.length) {
    const s = slots.at(-1);
    const { data: apptId, error: bErr } = await db.rpc("book_appointment", {
      p_service: svc.id,
      p_provider: s.provider_id,
      p_starts: s.starts_at,
    });
    ok("patient books a slot", !bErr && !!apptId, bErr?.message);
    const { error: again } = await db.rpc("book_appointment", { p_service: svc.id, p_provider: s.provider_id, p_starts: s.starts_at });
    ok("double-booking the same slot is refused", !!again, again?.message);
    if (apptId) {
      const { error: cErr } = await db.from("appointments").update({ status: "cancelled" }).eq("id", apptId);
      ok("patient cancels own booking", !cErr, cErr?.message);
    }
  }
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
