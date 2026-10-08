import { clinic } from "./brand";
import { formatDateTime } from "./format";

/**
 * WhatsApp message templates. Each `name` must match a template approved in
 * Meta's WhatsApp Manager; `params` are the {{1}}, {{2}}… body variables in order.
 * `preview` renders the same text locally for message_log.body.
 */
export type TemplateKey = "appt_confirmed" | "appt_reminder" | "session_due" | "payment_link";

type Template = {
  name: string;
  params: (v: Record<string, string>) => string[];
  preview: (v: Record<string, string>) => string;
};

export const whatsappTemplates: Record<TemplateKey, Template> = {
  appt_confirmed: {
    name: "skinsense_appt_confirmed",
    params: (v) => [v.name, v.when],
    preview: (v) =>
      `Hi ${v.name}, your appointment at ${clinic.name} is confirmed for ${v.when}. Reply here if you need to reschedule.`,
  },
  appt_reminder: {
    name: "skinsense_appt_reminder",
    params: (v) => [v.name, v.when],
    preview: (v) =>
      `Hi ${v.name}, a reminder of your visit to ${clinic.name} tomorrow, ${v.when}. ${clinic.address}.`,
  },
  session_due: {
    name: "skinsense_session_due",
    params: (v) => [v.name, v.session, v.protocol],
    preview: (v) =>
      `Hi ${v.name}, session ${v.session} of your ${v.protocol} is now due. Book in the app or reply to this message.`,
  },
  payment_link: {
    name: "skinsense_payment_link",
    params: (v) => [v.name, v.amount, v.link],
    preview: (v) => `Hi ${v.name}, your bill of ${v.amount} from ${clinic.name} is ready. Pay securely: ${v.link}`,
  },
};

export function whenText(iso: string) {
  return formatDateTime(iso);
}
