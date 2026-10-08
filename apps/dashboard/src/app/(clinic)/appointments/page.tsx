import { apptStatusLabel, formatDate, formatTime } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/action-form";
import { Badge, Empty, PageHeader, Section, Skeleton } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

import { createAppointment } from "../actions";

export default function AppointmentsPage() {
  return (
    <>
      <PageHeader eyebrow="Schedule" title="Appointments" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Suspense fallback={<Skeleton rows={10} />}>
          <Week />
        </Suspense>
        <Suspense fallback={<Skeleton rows={6} />}>
          <NewAppointment />
        </Suspense>
      </div>
    </>
  );
}

async function Week() {
  await requireStaff();
  const supabase = await createClient();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + 7 * 86_400_000);

  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, status, source, patients(id, full_name), services(name)")
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");

  const byDay = new Map<string, NonNullable<typeof data>>();
  for (const a of data ?? []) {
    const key = formatDate(a.starts_at);
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  return (
    <Section title="Next 7 days">
      {!data?.length ? <Empty title="Nothing booked this week" /> : null}
      <div className="space-y-6">
        {[...byDay.entries()].map(([day, list]) => (
          <div key={day} className="space-y-2">
            <p className="eyebrow">{day}</p>
            <ul className="card divide-y divide-line">
              {list.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="w-20 font-medium">{formatTime(a.starts_at)}</span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/patients/${a.patients?.id}`}>{a.patients?.full_name}</Link>
                    <span className="text-muted"> · {a.services?.name ?? "Consultation"}</span>
                  </span>
                  <span className="flex gap-1">
                    {a.source === "app" ? <Badge tone="plum">App</Badge> : null}
                    <Badge tone="muted">{apptStatusLabel[a.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

async function NewAppointment() {
  await requireStaff();
  const supabase = await createClient();
  const [patients, services, doctors] = await Promise.all([
    supabase.from("patients").select("id, full_name, phone").order("full_name").limit(500),
    supabase.from("services").select("id, name, duration_min").eq("active", true).order("name"),
    supabase.from("staff").select("id, full_name").eq("active", true).in("role", ["doctor", "owner"]),
  ]);

  return (
    <Section title="Book a visit">
      <div className="card p-5">
        <ActionForm action={createAppointment} submitLabel="Book">
          <div>
            <label className="label" htmlFor="patient_id">
              Patient
            </label>
            <select id="patient_id" name="patient_id" required className="field">
              {patients.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.phone}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              New patient? <Link href="/patients/new">Register them first</Link>.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="service_id">
              Treatment
            </label>
            <select id="service_id" name="service_id" required className="field">
              {services.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_min} min)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="provider_id">
              Doctor
            </label>
            <select id="provider_id" name="provider_id" required className="field">
              {doctors.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">
                Date
              </label>
              <input id="date" name="date" type="date" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="time">
                Time
              </label>
              <input id="time" name="time" type="time" step={900} required className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="source">
              Booked via
            </label>
            <select id="source" name="source" className="field" defaultValue="phone">
              <option value="phone">Phone</option>
              <option value="walk_in">Walk-in</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify" defaultChecked /> Send WhatsApp confirmation
          </label>
        </ActionForm>
      </div>
    </Section>
  );
}
