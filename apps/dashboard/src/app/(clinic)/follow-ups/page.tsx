import { formatDate, formatINR } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, Empty, PageHeader, Skeleton } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

import { nudgeDrift } from "../actions";

export default function FollowUpsPage() {
  return (
    <>
      <PageHeader eyebrow="Course drift" title="Follow-ups due" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-muted">
        Patients whose next session is past its due window, ranked by remaining course value and days overdue. A nudge sends the
        “session due” WhatsApp template straight away.
      </p>
      <Suspense fallback={<Skeleton rows={8} />}>
        <DriftList />
      </Suspense>
    </>
  );
}

async function DriftList() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("v_drift").select("*").order("rank_score", { ascending: false }).limit(100);

  if (!data?.length) return <Empty title="Everyone is on schedule" body="No courses are overdue right now." />;

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Course</th>
            <th>Due by</th>
            <th>Overdue</th>
            <th>Value left</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.plan_session_id}>
              <td>
                <Link href={`/patients/${d.patient_id}`} className="font-medium">
                  {d.full_name}
                </Link>
                <p className="text-xs text-muted">{d.phone}</p>
              </td>
              <td>
                {d.protocol_name}
                <p className="text-xs text-muted">
                  Session {d.session_seq} of {d.session_count}
                </p>
              </td>
              <td className="whitespace-nowrap">{d.due_to ? formatDate(d.due_to, { weekday: undefined }) : "—"}</td>
              <td>
                <Badge tone={(d.days_overdue ?? 0) > 14 ? "danger" : "warn"}>{d.days_overdue} days</Badge>
              </td>
              <td className="whitespace-nowrap">{formatINR(d.remaining_value_paise)}</td>
              <td className="text-right">
                <form action={nudgeDrift}>
                  <input type="hidden" name="patient_id" value={d.patient_id ?? ""} />
                  <input type="hidden" name="session" value={String(d.session_seq ?? "")} />
                  <input type="hidden" name="protocol" value={d.protocol_name ?? ""} />
                  <button className="btn-ghost min-h-9 px-3 text-xs">Send nudge</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
