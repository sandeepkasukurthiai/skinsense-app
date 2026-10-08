import { formatDate, formatINR } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, Empty, PageHeader, Skeleton, Stat } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export default function BillingPage() {
  return (
    <>
      <PageHeader eyebrow="Payments" title="Billing" />
      <Suspense fallback={<Skeleton rows={8} />}>
        <Invoices />
      </Suspense>
    </>
  );
}

async function Invoices() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, created_at, amount_paise, paid_at, method, razorpay_payment_id, patients(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const due = (data ?? []).filter((i) => !i.paid_at);
  const paidThisMonth = (data ?? []).filter((i) => i.paid_at && new Date(i.paid_at) >= monthStart);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={formatINR(due.reduce((s, i) => s + i.amount_paise, 0))} hint={`${due.length} bills`} />
        <Stat label="Collected this month" value={formatINR(paidThisMonth.reduce((s, i) => s + i.amount_paise, 0))} />
        <Stat label="Paid online" value={String(paidThisMonth.filter((i) => i.razorpay_payment_id).length)} hint="via Razorpay this month" />
      </div>
      {!data?.length ? (
        <Empty title="No bills yet" body="Create bills from a patient’s record." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...due, ...(data ?? []).filter((i) => i.paid_at)].map((i) => (
                <tr key={i.id}>
                  <td className="whitespace-nowrap">{formatDate(i.created_at, { weekday: undefined, year: "numeric" })}</td>
                  <td>
                    <Link href={`/patients/${i.patients?.id}`}>{i.patients?.full_name}</Link>
                  </td>
                  <td className="font-medium">{formatINR(i.amount_paise)}</td>
                  <td>{i.paid_at ? <Badge tone="ok">Paid · {i.method}</Badge> : <Badge tone="warn">Due</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
