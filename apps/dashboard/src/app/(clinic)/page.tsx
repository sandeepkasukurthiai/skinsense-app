import { apptStatusLabel, clinicDayRange, formatDate, formatINR, formatTime, nextApptStatus, type ApptStatus } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, Empty, PageHeader, Section, Skeleton, Stat } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

import { advanceAppointment } from "./actions";

export default function TodayPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Skin Sensé · Banjara Hills"
        title="Today at the clinic"
        actions={
          <Link href="/appointments" className="btn">
            New appointment
          </Link>
        }
      />
      <div className="space-y-10">
        <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Skeleton rows={2} /><Skeleton rows={2} /><Skeleton rows={2} /><Skeleton rows={2} /></div>}>
          <Metrics />
        </Suspense>
        <Suspense fallback={<Skeleton rows={6} />}>
          <DayBoard />
        </Suspense>
      </div>
    </>
  );
}

async function Metrics() {
  await requireStaff();
  const supabase = await createClient();
  const { data: m } = await supabase.from("v_clinic_metrics").select("*").maybeSingle();
  const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v)}%`);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Active courses" value={String(m?.active_courses ?? 0)} />
      <Stat label="Course completion" value={pct(m?.course_completion_pct)} />
      <Stat
        label="Drifting from schedule"
        value={String(m?.drift_count ?? 0)}
        hint={m?.drift_value_paise ? `${formatINR(m.drift_value_paise)} of course value at risk` : undefined}
      />
      <Stat label="No-show rate" value={pct(m?.no_show_pct)} />
    </div>
  );
}

const tone: Record<ApptStatus, "plum" | "gold" | "ok" | "warn" | "danger" | "muted"> = {
  booked: "plum",
  arrived: "gold",
  in_chair: "warn",
  completed: "ok",
  no_show: "danger",
  cancelled: "muted",
};

async function DayBoard() {
  await requireStaff();
  const supabase = await createClient();
  const { from, to } = clinicDayRange();
  const { data: rows, error } = await supabase
    .from("v_day_board")
    .select("*")
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at");

  return (
    <Section title={`Day board · ${formatDate(new Date().toISOString(), { year: "numeric" })}`}>
      {error ? <p className="text-sm text-danger">{error.message}</p> : null}
      {!rows?.length ? (
        <Empty title="No visits booked today" body="Walk-ins and phone bookings can be added from Appointments." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Treatment</th>
                <th>Flags</th>
                <th>Status</th>
                <th className="text-right">Next step</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const next = r.status ? nextApptStatus[r.status] : undefined;
                return (
                  <tr key={r.appointment_id}>
                    <td className="whitespace-nowrap font-medium">{r.starts_at ? formatTime(r.starts_at) : "—"}</td>
                    <td>
                      <Link href={`/patients/${r.patient_id}`} className="font-medium">
                        {r.full_name}
                      </Link>
                      <p className="text-xs text-muted">{r.phone}</p>
                    </td>
                    <td>
                      {r.service_name ?? "Consultation"}
                      {r.protocol_name ? (
                        <p className="text-xs text-muted">
                          {r.protocol_name} · session {r.session_seq}/{r.session_count}
                        </p>
                      ) : null}
                    </td>
                    <td className="space-x-1 space-y-1">
                      {r.clinical_consent_ok === false ? <Badge tone="danger">No consent</Badge> : null}
                      {r.is_minor ? <Badge tone="gold">Minor</Badge> : null}
                      {r.fitzpatrick ? <Badge tone="muted">Fitz {r.fitzpatrick}</Badge> : null}
                      {r.source === "app" ? <Badge tone="plum">App</Badge> : null}
                    </td>
                    <td>{r.status ? <Badge tone={tone[r.status]}>{apptStatusLabel[r.status]}</Badge> : null}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {next ? (
                          <form action={advanceAppointment}>
                            <input type="hidden" name="id" value={r.appointment_id ?? ""} />
                            <input type="hidden" name="to" value={next} />
                            <button className="btn-ghost min-h-9 px-3 text-xs">Mark {apptStatusLabel[next].toLowerCase()}</button>
                          </form>
                        ) : null}
                        {r.status === "booked" ? (
                          <form action={advanceAppointment}>
                            <input type="hidden" name="id" value={r.appointment_id ?? ""} />
                            <input type="hidden" name="to" value="no_show" />
                            <button className="min-h-9 rounded-full px-3 text-xs text-muted hover:text-danger">No-show</button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
