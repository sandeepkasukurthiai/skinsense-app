import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} — see apps/dashboard/.env.example`);
  return v;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: () => required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseSecretKey: () => required("SUPABASE_SECRET_KEY"),
  appBaseUrl: () => process.env.APP_BASE_URL ?? "http://localhost:3000",
  razorpayKeyId: () => required("RAZORPAY_KEY_ID"),
  razorpayKeySecret: () => required("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: () => required("RAZORPAY_WEBHOOK_SECRET"),
  whatsappPhoneNumberId: () => required("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappAccessToken: () => required("WHATSAPP_ACCESS_TOKEN"),
  whatsappVerifyToken: () => required("WHATSAPP_VERIFY_TOKEN"),
  whatsappLive: () => process.env.WHATSAPP_MODE === "live",
  cronSecret: () => required("CRON_SECRET"),
};
