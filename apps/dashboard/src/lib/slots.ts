import "server-only";

import { createAdminClient } from "./supabase/admin";

/**
 * staff.working_hours shape (per weekday, IST, list of [start, end] ranges):
 *   { "mon": [["10:00","13:00"],["14:00","17:00"]], "tue": [...], ... }
 * Missing or empty → clinic default Mon–Sat 10:00–17:00.
 */
type WorkingHours = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", [string, string][]>>;

const DEFAULT_HOURS: [string, string][] = [["10:00", "17:00"]];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const STEP_MIN = 15;

export type Slot = { starts_at: string; ends_at: string; provider_id: string; provider_name: string };

function istDate(ymd: string, hhmm: string) {
  return new Date(`${ymd}T${hhmm}:00+05:30`);
}

/** Open slots for a service on a clinic day, across all active doctors. */
export async function openSlots(serviceId: string, ymd: string): Promise<Slot[]> {
  const db = createAdminClient();

  const [{ data: service }, { data: doctors }] = await Promise.all([
    db.from("services").select("duration_min, active").eq("id", serviceId).single(),
    db.from("staff").select("id, full_name, working_hours").eq("active", true).in("role", ["doctor", "owner"]),
  ]);
  if (!service?.active || !doctors?.length) return [];

  const dayStart = istDate(ymd, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const weekday = DAY_KEYS[new Date(`${ymd}T12:00:00+05:30`).getUTCDay()];

  const { data: busy } = await db
    .from("appointments")
    .select("provider_id, starts_at, ends_at")
    .in("provider_id", doctors.map((d) => d.id))
    .not("status", "in", "(cancelled,no_show)")
    .lt("starts_at", dayEnd.toISOString())
    .gt("ends_at", dayStart.toISOString());

  const now = Date.now() + 30 * 60_000; // no bookings starting within 30 minutes
  const durMs = service.duration_min * 60_000;
  const slots: Slot[] = [];

  for (const doc of doctors) {
    const hours = (doc.working_hours ?? {}) as WorkingHours;
    const ranges = Object.keys(hours).length ? (hours[weekday] ?? []) : weekday === "sun" ? [] : DEFAULT_HOURS;
    const taken = (busy ?? []).filter((b) => b.provider_id === doc.id);

    for (const [from, to] of ranges) {
      const end = istDate(ymd, to).getTime();
      for (let t = istDate(ymd, from).getTime(); t + durMs <= end; t += STEP_MIN * 60_000) {
        if (t < now) continue;
        const clash = taken.some((b) => t < new Date(b.ends_at).getTime() && t + durMs > new Date(b.starts_at).getTime());
        if (!clash) {
          slots.push({
            starts_at: new Date(t).toISOString(),
            ends_at: new Date(t + durMs).toISOString(),
            provider_id: doc.id,
            provider_name: doc.full_name,
          });
        }
      }
    }
  }
  return slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
