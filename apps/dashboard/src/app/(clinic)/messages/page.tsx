import { formatDateTime } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, Empty, PageHeader, Section, Skeleton } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

import { approveMessage, discardMessage } from "../actions";

export default function MessagesPage() {
  return (
    <>
      <PageHeader eyebrow="WhatsApp" title="Messages" />
      <div className="space-y-10">
        <Suspense fallback={<Skeleton rows={4} />}>
          <Approvals />
        </Suspense>
        <Suspense fallback={<Skeleton rows={8} />}>
          <Log />
        </Suspense>
      </div>
    </>
  );
}

async function Approvals() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("message_log")
    .select("id, body, created_at, patients(id, full_name)")
    .eq("status", "pending_approval")
    .order("created_at");

  return (
    <Section title="Waiting for approval">
      {!data?.length ? (
        <Empty title="Nothing to approve" body="The nightly scheduler drafts follow-up nudges here for review." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((m) => (
            <div key={m.id} className="card space-y-3 p-5">
              <p className="text-xs text-muted">
                To <Link href={`/patients/${m.patients?.id}`}>{m.patients?.full_name}</Link> · drafted {formatDateTime(m.created_at)}
              </p>
              <p className="rounded-xl bg-blush p-3 text-sm leading-relaxed">{m.body}</p>
              <div className="flex gap-2">
                <form action={approveMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="btn">Approve & send</button>
                </form>
                <form action={discardMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="btn-ghost">Discard</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

const tone = { sent: "ok", delivered: "ok", queued: "plum", failed: "danger", cancelled: "muted", draft: "muted", pending_approval: "gold" } as const;

async function Log() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("message_log")
    .select("id, body, status, created_at, response, patients(id, full_name)")
    .neq("status", "pending_approval")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <Section title="Recent messages">
      {!data?.length ? (
        <Empty title="No messages yet" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Patient</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                  <td>
                    <Link href={`/patients/${m.patients?.id}`}>{m.patients?.full_name}</Link>
                  </td>
                  <td className="max-w-md text-muted">{m.body}</td>
                  <td>
                    <Badge tone={tone[m.status]}>{m.status.replace("_", " ")}</Badge>
                    {m.response ? <p className="mt-1 text-xs text-muted">{m.response}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
