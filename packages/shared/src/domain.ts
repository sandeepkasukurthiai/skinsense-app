import type { Enums, Tables } from "./database.types";

export type AppRole = Enums<"app_role">;
export type ApptStatus = Enums<"appt_status">;
export type ServiceLine = Enums<"service_line">;

export type Patient = Tables<"patients">;
export type Staff = Tables<"staff">;
export type Appointment = Tables<"appointments">;
export type Service = Tables<"services">;
export type Protocol = Tables<"protocols">;
export type TreatmentPlan = Tables<"treatment_plans">;
export type PlanSession = Tables<"plan_sessions">;
export type Invoice = Tables<"invoices">;
export type Prescription = Tables<"prescriptions">;
export type DayBoardRow = Tables<"v_day_board">;
export type DriftRow = Tables<"v_drift">;
export type ClinicMetrics = Tables<"v_clinic_metrics">;

export const apptStatusLabel: Record<ApptStatus, string> = {
  booked: "Booked",
  arrived: "Arrived",
  in_chair: "In chair",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

/** Front-desk flow: which status comes next from the day board. */
export const nextApptStatus: Partial<Record<ApptStatus, ApptStatus>> = {
  booked: "arrived",
  arrived: "in_chair",
  in_chair: "completed",
};

export const serviceLineLabel: Record<ServiceLine, string> = {
  clinical: "Clinical",
  cosmetic: "Cosmetic",
  paediatric: "Paediatric",
  surgery: "Dermato-surgery",
  venereology: "Venereology",
};

export const STAFF_ROLES: AppRole[] = ["front_desk", "doctor", "owner"];
export const CLINICIAN_ROLES: AppRole[] = ["doctor", "owner"];

/** Progress of a course from its sessions. */
export function planProgress<S extends Pick<PlanSession, "performed_at" | "seq">>(sessions: S[]) {
  const total = sessions.length;
  const done = sessions.filter((s) => s.performed_at).length;
  const next = [...sessions].sort((a, b) => a.seq - b.seq).find((s) => !s.performed_at) ?? null;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0, next };
}

/** A prescription line as stored in prescriptions.items (jsonb array). */
export type RxItem = {
  drug: string;
  strength?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

/** An invoice line as stored in invoices.lines (jsonb array). */
export type InvoiceLine = { label: string; qty: number; unit_paise: number };

export function invoiceTotal(lines: InvoiceLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unit_paise, 0);
}
