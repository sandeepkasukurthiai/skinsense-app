import { planProgress, type RxItem } from "@skinsense/shared";

import { supabase } from "./supabase";

/** Next upcoming booked appointment, with service and doctor. */
export async function fetchNextAppointment() {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, provider_id, services(name, line)")
    .in("status", ["booked", "arrived"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const doctor = await fetchClinician(data.provider_id);
  return { ...data, doctor };
}

export async function fetchClinician(id: string) {
  const { data } = await supabase.from("v_clinicians").select("full_name, qualification").eq("id", id).maybeSingle();
  return data;
}

export async function fetchAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, source, services(name)")
    .order("starts_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

/** Active treatment courses with their session schedule. */
export async function fetchActivePlans() {
  const { data, error } = await supabase
    .from("treatment_plans")
    .select("id, status, started_on, protocols(name, session_count, interval_days, photo_at), plan_sessions(id, seq, due_from, due_to, performed_at, photo_required)")
    .eq("status", "active")
    .order("started_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, progress: planProgress(p.plan_sessions ?? []) }));
}

export async function fetchAllPlans() {
  const { data, error } = await supabase
    .from("treatment_plans")
    .select("id, status, started_on, protocols(name, session_count), plan_sessions(id, seq, due_from, due_to, performed_at, photo_required)")
    .order("started_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, progress: planProgress(p.plan_sessions ?? []) }));
}

export async function fetchLatestRegimen(): Promise<{ id: string; items: RxItem[] } | null> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, items, valid_to, signed_at")
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.valid_to && new Date(data.valid_to) < new Date()) return null;
  return { id: data.id, items: (Array.isArray(data.items) ? data.items : []) as unknown as RxItem[] };
}

export async function fetchServices() {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, line, duration_min, list_price_paise")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchPrescriptions() {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, items, signed_at, valid_to, telemedicine, provider_id")
    .order("signed_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, amount_paise, lines, paid_at, created_at, method")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
