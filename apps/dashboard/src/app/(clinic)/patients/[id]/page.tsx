import {
  apptStatusLabel,
  CLINICIAN_ROLES,
  formatDate,
  formatDateTime,
  formatINR,
  planProgress,
  type InvoiceLine,
  type RxItem,
} from "@skinsense/shared";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/action-form";
import { Badge, Empty, PageHeader, Section, Skeleton } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

import {
  addNote,
  addPrescription,
  createInvoice,
  markInvoicePaid,
  recordConsent,
  recordSession,
  sendPaymentLink,
  startPlan,
} from "../../actions";

export default function PatientPage({ params }: PageProps<"/patients/[id]">) {
  return (
    <Suspense fallback={<Skeleton rows={10} />}>
      <PatientRecord params={params} />
    </Suspense>
  );
}

async function PatientRecord({ params }: { params: PageProps<"/patients/[id]">["params"] }) {
  const me = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const isClinician = CLINICIAN_ROLES.includes(me.role);

  const [patient, consents, plans, appts, notes, rx, invoices, protocols] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).maybeSingle(),
    supabase.from("consents").select("id, kind, granted_at, withdrawn_at").eq("patient_id", id),
    supabase
      .from("treatment_plans")
      .select("id, status, started_on, package_price_paise, protocols(name, session_count), plan_sessions(id, seq, due_from, due_to, performed_at, photo_required)")
      .eq("patient_id", id)
      .order("started_on", { ascending: false }),
    supabase.from("appointments").select("id, starts_at, status, source, services(name)").eq("patient_id", id).order("starts_at", { ascending: false }).limit(20),
    supabase.from("clinical_notes").select("id, created_at, free_text, template, amends_note_id").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("prescriptions").select("id, signed_at, items, valid_to, telemedicine").eq("patient_id", id).order("signed_at", { ascending: false }),
    supabase.from("invoices").select("id, created_at, amount_paise, lines, paid_at, method").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("protocols").select("id, name, session_count, interval_days").eq("active", true).order("name"),
  ]);

  const p = patient.data;
  if (!p) notFound();
  const liveConsent = (kind: string) => consents.data?.some((c) => c.kind === kind && c.granted_at && !c.withdrawn_at);

  return (
    <>
      <PageHeader eyebrow="Patient" title={p.full_name} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-10">
          {/* Courses */}
          <Section title="Treatment courses">
            {!plans.data?.length ? <Empty title="No courses yet" /> : null}
            {plans.data?.map((plan) => {
              const prog = planProgress(plan.plan_sessions ?? []);
              const sessions = [...(plan.plan_sessions ?? [])].sort((a, b) => a.seq - b.seq);
              return (
                <div key={plan.id} className="card space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{plan.protocols?.name}</p>
                      <p className="text-xs text-muted">
                        Started {formatDate(plan.started_on, { weekday: undefined, year: "numeric" })}
                        {plan.package_price_paise ? ` · package ${formatINR(plan.package_price_paise)}` : ""}
                      </p>
                    </div>
                    <Badge tone={plan.status === "active" ? "plum" : plan.status === "completed" ? "ok" : "warn"}>
                      {prog.done}/{prog.total} · {plan.status}
                    </Badge>
                  </div>
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {sessions.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-xl bg-blush px-3 py-2 text-sm">
                        <span>
                          Session {s.seq}
                          {s.photo_required ? <span className="text-xs text-gold-text"> · photos</span> : null}
                        </span>
                        <span className="text-xs text-muted">
                          {s.performed_at
                            ? `Done ${formatDate(s.performed_at, { weekday: undefined })}`
                            : `Due ${formatDate(s.due_from, { weekday: undefined })}–${formatDate(s.due_to, { weekday: undefined })}`}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {prog.next && plan.status === "active" ? (
                    <details className="rounded-xl border border-line p-4">
                      <summary className="cursor-pointer text-sm font-medium text-plum">Record session {prog.next.seq}</summary>
                      <ActionForm action={recordSession} submitLabel="Save session" className="mt-4 space-y-3">
                        <input type="hidden" name="plan_session_id" value={prog.next.id} />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field name="device" label="Device" />
                          <Field name="fluence" label="Fluence / strength" />
                          <Field name="pulse_width" label="Pulse width" />
                          <Field name="passes" label="Passes" type="number" />
                          <Field name="endpoint" label="Endpoint" />
                          <Field name="adverse_event" label="Adverse event" />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="pih_watch" /> PIH watch
                        </label>
                      </ActionForm>
                    </details>
                  ) : null}
                </div>
              );
            })}
            {isClinician && protocols.data?.length ? (
              <div className="card p-5">
                <ActionForm action={startPlan} submitLabel="Start course" variant="btn-ghost" className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="patient_id" value={p.id} />
                  <div className="min-w-56 flex-1">
                    <label className="label" htmlFor="protocol_id">
                      New course from protocol
                    </label>
                    <select id="protocol_id" name="protocol_id" className="field" required>
                      {protocols.data.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name} — {pr.session_count} sessions, every {pr.interval_days} days
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="start">
                      Start date
                    </label>
                    <input id="start" name="start" type="date" className="field" />
                  </div>
                </ActionForm>
              </div>
            ) : null}
          </Section>

          {/* Notes */}
          <Section title="Clinical notes">
            {isClinician ? (
              <div className="card p-5">
                <ActionForm action={addNote} submitLabel="Save note">
                  <input type="hidden" name="patient_id" value={p.id} />
                  <label className="label" htmlFor="free_text">
                    New note
                  </label>
                  <textarea id="free_text" name="free_text" rows={4} className="field" placeholder="Findings, diagnosis, plan…" />
                </ActionForm>
              </div>
            ) : null}
            {!notes.data?.length ? <Empty title="No notes yet" /> : null}
            {notes.data?.map((n) => (
              <article key={n.id} className="card space-y-2 p-5">
                <p className="text-xs text-muted">
                  {formatDateTime(n.created_at)}
                  {n.amends_note_id ? " · amendment" : ""}
                  {n.template ? ` · ${n.template}` : ""}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed">{n.free_text}</p>
              </article>
            ))}
          </Section>

          {/* Prescriptions */}
          <Section title="Prescriptions">
            {isClinician ? (
              <div className="card p-5">
                <ActionForm action={addPrescription} submitLabel="Sign prescription">
                  <input type="hidden" name="patient_id" value={p.id} />
                  <label className="label" htmlFor="items">
                    One medicine per line: drug | strength | dose | frequency | duration | instructions
                  </label>
                  <textarea
                    id="items"
                    name="items"
                    rows={4}
                    className="field font-mono text-xs"
                    placeholder={"Adapalene gel | 0.1% | pea-sized | at night | 8 weeks | avoid eye area"}
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-40">
                      <label className="label" htmlFor="valid_days">
                        Valid for (days)
                      </label>
                      <input id="valid_days" name="valid_days" type="number" defaultValue={30} className="field" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="telemedicine" disabled={!liveConsent("telemed")} />
                      Tele-consult {liveConsent("telemed") ? "" : "(needs telemed consent)"}
                    </label>
                  </div>
                </ActionForm>
              </div>
            ) : null}
            {!rx.data?.length ? <Empty title="No prescriptions" /> : null}
            {rx.data?.map((r) => (
              <div key={r.id} className="card space-y-2 p-5">
                <p className="text-xs text-muted">
                  Signed {formatDateTime(r.signed_at)}
                  {r.valid_to ? ` · valid to ${formatDate(r.valid_to, { weekday: undefined })}` : ""}
                  {r.telemedicine ? " · tele-consult" : ""}
                </p>
                <ul className="space-y-1 text-sm">
                  {((Array.isArray(r.items) ? r.items : []) as unknown as RxItem[]).map((it, i) => (
                    <li key={i}>
                      <span className="font-medium">
                        {it.drug} {it.strength}
                      </span>{" "}
                      <span className="text-muted">{[it.dose, it.frequency, it.duration, it.instructions].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        </div>

        {/* Side column */}
        <div className="min-w-0 space-y-10">
          <Section title="Profile">
            <dl className="card grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-5 text-sm">
              <dt className="text-muted">Phone</dt>
              <dd>{p.phone}</dd>
              <dt className="text-muted">Born</dt>
              <dd>{p.dob ? formatDate(p.dob, { weekday: undefined, year: "numeric" }) : "—"}</dd>
              <dt className="text-muted">Sex</dt>
              <dd className="capitalize">{p.sex ?? "—"}</dd>
              <dt className="text-muted">Fitzpatrick</dt>
              <dd>{p.fitzpatrick ?? "—"}</dd>
              <dt className="text-muted">Concern</dt>
              <dd>{p.presenting_concern ?? "—"}</dd>
              <dt className="text-muted">Allergies</dt>
              <dd>{p.allergies ?? "—"}</dd>
              <dt className="text-muted">App</dt>
              <dd>{p.auth_user_id ? "Linked" : "Not signed in yet"}</dd>
            </dl>
          </Section>

          <Section title="Consents">
            <div className="card divide-y divide-line p-2">
              {(["clinical", "telemed", "marketing"] as const).map((kind) => (
                <div key={kind} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="capitalize">{kind}</span>
                  {liveConsent(kind) ? (
                    <Badge tone="ok">On file</Badge>
                  ) : (
                    <form action={recordConsent}>
                      <input type="hidden" name="patient_id" value={p.id} />
                      <input type="hidden" name="kind" value={kind} />
                      <button className="btn-ghost min-h-8 px-3 text-xs">Record consent</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Visits">
            {!appts.data?.length ? <Empty title="No visits" /> : null}
            <ul className="card divide-y divide-line">
              {appts.data?.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p>{a.services?.name ?? "Consultation"}</p>
                    <p className="text-xs text-muted">{formatDateTime(a.starts_at)}</p>
                  </div>
                  <Badge tone="muted">{apptStatusLabel[a.status]}</Badge>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Bills">
            <div className="card p-5">
              <ActionForm action={createInvoice} submitLabel="Create bill" variant="btn-ghost">
                <input type="hidden" name="patient_id" value={p.id} />
                <label className="label" htmlFor="lines">
                  One line each: label | qty | price ₹
                </label>
                <textarea id="lines" name="lines" rows={3} className="field font-mono text-xs" placeholder={"Consultation | 1 | 800"} />
              </ActionForm>
            </div>
            {invoices.data?.map((inv) => (
              <div key={inv.id} className="card space-y-3 p-5">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-2xl font-semibold text-plum-deep">{formatINR(inv.amount_paise)}</p>
                  {inv.paid_at ? <Badge tone="ok">Paid · {inv.method}</Badge> : <Badge tone="warn">Due</Badge>}
                </div>
                <ul className="text-xs text-muted">
                  {((Array.isArray(inv.lines) ? inv.lines : []) as unknown as InvoiceLine[]).map((l, i) => (
                    <li key={i}>
                      {l.label} × {l.qty} — {formatINR(l.qty * l.unit_paise)}
                    </li>
                  ))}
                </ul>
                {!inv.paid_at ? (
                  <div className="flex flex-wrap gap-2">
                    <ActionForm action={sendPaymentLink} submitLabel="Send Razorpay link" variant="btn-gold" className="space-y-2">
                      <input type="hidden" name="id" value={inv.id} />
                    </ActionForm>
                    <form action={markInvoicePaid} className="flex gap-2">
                      <input type="hidden" name="id" value={inv.id} />
                      <select name="method" className="field w-28 py-2" aria-label="Payment method" defaultValue="cash">
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                      </select>
                      <button className="btn-ghost">Mark paid</button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </Section>
        </div>
      </div>
    </>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} className="field" />
    </div>
  );
}
