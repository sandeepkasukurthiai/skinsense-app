import { openSlots } from "@/lib/slots";
import { patientFromRequest } from "@/lib/supabase/patient";

/** GET /api/patient/slots?service_id=…&date=YYYY-MM-DD → open times across doctors. */
export async function GET(req: Request) {
  const auth = await patientFromRequest(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");
  const date = url.searchParams.get("date");
  if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "service_id and date are required" }, { status: 400 });
  }
  return Response.json({ slots: await openSlots(serviceId, date) });
}
