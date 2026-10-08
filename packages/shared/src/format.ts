import { clinic } from "./brand";

/** Money is stored in paise (integer). */
export function formatINR(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

const tz = clinic.timezone;

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: tz,
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** "Good morning" / "Good afternoon" / "Good evening" in clinic time. */
export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: tz }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Start and end of a clinic-local day as ISO strings (IST is a fixed +05:30). */
export function clinicDayRange(day: Date = new Date()): { from: string; to: string } {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(day); // YYYY-MM-DD
  return {
    from: new Date(`${ymd}T00:00:00+05:30`).toISOString(),
    to: new Date(`${ymd}T23:59:59.999+05:30`).toISOString(),
  };
}

/** Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX). */
export function toE164India(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}
