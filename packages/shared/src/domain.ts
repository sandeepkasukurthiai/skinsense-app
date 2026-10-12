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

export type StaffRole = Exclude<AppRole, "patient">;

export const STAFF_ROLES: StaffRole[] = [
  "owner",
  "doctor",
  "staff",
  "front_desk",
  "pharmacy",
  "centre_manager",
  "operations_head",
];
export const CLINICIAN_ROLES: StaffRole[] = ["doctor", "owner"];

/** Dashboard sections. Each role sees only the ones listed in its profile. */
export type NavKey = "today" | "appointments" | "patients" | "prescriptions" | "follow-ups" | "billing" | "messages";

export const navItems: Record<NavKey, { href: string; label: string }> = {
  today: { href: "/", label: "Today" },
  appointments: { href: "/appointments", label: "Appointments" },
  patients: { href: "/patients", label: "Patients" },
  prescriptions: { href: "/prescriptions", label: "Dispensary" },
  "follow-ups": { href: "/follow-ups", label: "Follow-ups" },
  billing: { href: "/billing", label: "Billing" },
  messages: { href: "/messages", label: "WhatsApp" },
};

/**
 * The eight-login model. Patients use the mobile app; every other role has its own
 * dashboard portal (login screen + landing page + navigation).
 */
export const roleProfiles: Record<
  StaffRole,
  { portal: string; numeral: string; title: string; tagline: string; nav: NavKey[] }
> = {
  owner: {
    portal: "Super user",
    numeral: "I",
    title: "The whole clinic, at a glance",
    tagline: "Every patient, every course, every rupee — and your team.",
    nav: ["today", "appointments", "patients", "prescriptions", "follow-ups", "billing", "messages"],
  },
  doctor: {
    portal: "Doctor",
    numeral: "II",
    title: "Your consultations today",
    tagline: "Your list, your patients' courses, notes and prescriptions.",
    nav: ["today", "appointments", "patients", "prescriptions", "follow-ups"],
  },
  staff: {
    portal: "Clinical staff",
    numeral: "III",
    title: "Procedures on the floor",
    tagline: "Who is in, who is next, and the session to record.",
    nav: ["today", "appointments", "patients"],
  },
  front_desk: {
    portal: "Front desk",
    numeral: "IV",
    title: "Reception and billing",
    tagline: "Check-ins, bookings, bills and payments at the counter.",
    nav: ["today", "appointments", "patients", "billing", "messages"],
  },
  pharmacy: {
    portal: "Pharmacy",
    numeral: "V",
    title: "The dispensary",
    tagline: "Prescriptions signed by the doctors, ready to dispense.",
    nav: ["today", "prescriptions"],
  },
  centre_manager: {
    portal: "Centre manager",
    numeral: "VI",
    title: "Banjara Hills, today",
    tagline: "The centre's schedule, takings and follow-ups.",
    nav: ["today", "appointments", "patients", "follow-ups", "billing", "messages"],
  },
  operations_head: {
    portal: "Operations head",
    numeral: "VII",
    title: "Operations across centres",
    tagline: "Revenue, retention, drift and no-shows — the business view.",
    nav: ["today", "appointments", "follow-ups", "billing", "messages"],
  },
};

export function isStaffRole(role: AppRole | null | undefined): role is StaffRole {
  return !!role && role !== "patient";
}

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
