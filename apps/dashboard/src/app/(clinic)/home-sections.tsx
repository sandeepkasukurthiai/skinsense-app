import {
  apptStatusLabel,
  clinicDayRange,
  formatDate,
  formatDateTime,
  formatINR,
  formatTime,
  nextApptStatus,
  roleProfiles,
  type ApptStatus,
  type RxItem,
} from "@skinsense/shared";
import Link from "next/link";

import { Badge, Empty, Section, Stat } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

import { advanceAppointment } from "./actions";

/* ---------- Metrics ---------- */

export async function CourseMetrics() {
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

/** Today's visits and takings — front desk, centre manager. */
export async function TodayNumbers() {
  const supabase = await createClient();
  const { from, to } = clinicDayRange();
  const [{ data: visits }, { data: paid }, { data: due }] = await Promise.all([
    supabase.from("appointments").select("status").gte("starts_at", from).lte("starts_at", to).neq("status", "cancelled"),
    supabase.from("invoices").select("amount_paise").gte("paid_at", from).lte("paid_at", to),
    supabase.from("invoices").select("amount_paise").is("paid_at", null),
  ]);
  const count = (s: ApptStatus[]) => (visits ?? []).filter((v) => s.includes(v.status)).length;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Visits today" value={String(visits?.length ?? 0)} hint={`${count(["completed"])} seen · ${count(["booked"])} still to come`} />
      <Stat label="In the clinic now" value={String(count(["arrived", "in_chair"]))} hint="arrived or in the chair" />
      <Stat label="Collected today" value={formatINR((paid ?? []).reduce((s, i) => s + i.amount_paise, 0))} />
      <Stat label="Bills due" value={formatINR((due ?? []).reduce((s, i) => s + i.amount_paise, 0))} hint={`${due?.length ?? 0} unpaid`} />
    </div>
  );
}

/** Month-to-date business view — super user, operations head. */
export async function BusinessNumbers() {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [{ data: paid }, { data: due }, { data: appts }] = await Promise.all([
    supabase.from("invoices").select("amount_paise").gte("paid_at", monthStart.toISOString()),
    supabase.from("invoices").select("amount_paise").is("paid_at", null),
    supabase.from("appointments").select("status").gte("starts_at", monthStart.toISOString()).lte("starts_at", new Date().toISOString()),
  ]);
  const past = (appts ?? []).filter((a) => a.status !== "cancelled");
  const noShows = past.filter((a) => a.status === "no_show").length;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Collected this month" value={formatINR((paid ?? []).reduce((s, i) => s + i.amount_paise, 0))} />
      <Stat label="Outstanding" value={formatINR((due ?? []).reduce((s, i) => s + i.amount_paise, 0))} hint={`${due?.length ?? 0} bills`} />
      <Stat label="Visits this month" value={String(past.length)} />
      <Stat label="No-shows this month" value={String(noShows)} hint={past.length ? `${Math.round((noShows / past.length) * 100)}% of visits` : undefined} />
    </div>
  );
}

/* ---------- Day board ---------- */

const tone: Record<ApptStatus, "plum" | "gold" | "ok" | "warn" | "danger" | "muted"> = {
  booked: "plum",
  arrived: "gold",
  in_chair: "warn",
  completed: "ok",
  no_show: "danger",
  cancelled: "muted",
};

export async function DayBoard({
  providerId,
  floorOnly = false,
  canAct = true,
  title,
}: {
  providerId?: string;
  floorOnly?: boolean;
  canAct?: boolean;
  title?: string;
}) {
  const supabase = await createClient();
  const { from, to } = clinicDayRange();
  let query = supabase.from("v_day_board").select("*").gte("starts_at", from).lte("starts_at", to).order("starts_at");

  if (providerId) {
    const { data: mine } = await supabase
      .from("appointments")
      .select("id")
      .eq("provider_id", providerId)
      .gte("starts_at", from)
      .lte("starts_at", to);
    query = query.in("appointment_id", (mine ?? []).map((m) => m.id).concat("00000000-0000-0000-0000-000000000000"));
  }
  if (floorOnly) query = query.in("status", ["booked", "arrived", "in_chair"]);
  const { data: rows, error } = await query;

  return (
    <Section title={title ?? `Day board · ${formatDate(new Date().toISOString(), { year: "numeric" })}`}>
      {error ? <p className="text-sm text-danger">{error.message}</p> : null}
      {!rows?.length ? (
        <Empty title={providerId ? "No consultations on your list today" : "No visits booked today"} />
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
                {canAct ? <th className="text-right">Next step</th> : null}
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
                    {canAct ? (
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
                    ) : null}
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

/* ---------- Billing ---------- */

export async function BillsDue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, created_at, amount_paise, patients(id, full_name)")
    .is("paid_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <Section title="Bills to collect" actions={<Link href="/billing" className="text-sm">All billing</Link>}>
      {!data?.length ? (
        <Empty title="Nothing outstanding" />
      ) : (
        <ul className="card divide-y divide-line">
          {data.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
              <Link href={`/patients/${i.patients?.id}`} className="font-medium">
                {i.patients?.full_name}
              </Link>
              <span className="font-display text-xl font-semibold text-plum-deep">{formatINR(i.amount_paise)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ---------- Pharmacy ---------- */

export async function Dispensary({ days = 30, linkPatients = true }: { days?: number; linkPatients?: boolean }) {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await supabase
    .from("prescriptions")
    .select("id, signed_at, valid_to, items, telemedicine, patients(id, full_name, allergies), staff(full_name)")
    .gte("signed_at", since)
    .order("signed_at", { ascending: false });

  return (
    <Section title={`Prescriptions · last ${days} days`}>
      {!data?.length ? (
        <Empty title="No prescriptions to dispense" body="New prescriptions appear here as soon as a doctor signs them." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((rx) => (
            <article key={rx.id} className="card space-y-3 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {linkPatients ? (
                  <Link href={`/patients/${rx.patients?.id}`} className="font-display text-2xl font-semibold text-plum-deep">
                    {rx.patients?.full_name}
                  </Link>
                ) : (
                  <span className="font-display text-2xl font-semibold text-plum-deep">{rx.patients?.full_name}</span>
                )}
                <span className="text-xs text-muted">{formatDateTime(rx.signed_at)}</span>
              </div>
              <p className="text-xs text-muted">
                {rx.staff?.full_name}
                {rx.valid_to ? ` · valid to ${formatDate(rx.valid_to, { weekday: undefined })}` : ""}
                {rx.telemedicine ? " · tele-consult" : ""}
              </p>
              {rx.patients?.allergies ? <Badge tone="danger">Allergies: {rx.patients.allergies}</Badge> : null}
              <ul className="space-y-2 border-t border-line pt-3 text-sm">
                {((Array.isArray(rx.items) ? rx.items : []) as unknown as RxItem[]).map((it, i) => (
                  <li key={i}>
                    <span className="font-medium">
                      {it.drug} {it.strength}
                    </span>
                    <span className="text-muted"> · {[it.dose, it.frequency, it.duration].filter(Boolean).join(" · ")}</span>
                    {it.instructions ? <p className="text-xs text-muted">{it.instructions}</p> : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- Team (super user) ---------- */

export async function Team() {
  const supabase = await createClient();
  const { data } = await supabase.from("staff").select("id, full_name, role, qualification, active").order("role");
  return (
    <Section title="Your team">
      <ul className="card divide-y divide-line">
        {(data ?? []).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{s.full_name}</p>
              <p className="text-xs text-muted">{s.qualification ?? ""}</p>
            </div>
            <Badge tone={s.active ? "plum" : "muted"}>{s.role === "patient" ? "Patient" : roleProfiles[s.role].portal}</Badge>
          </li>
        ))}
      </ul>
    </Section>
  );
}
