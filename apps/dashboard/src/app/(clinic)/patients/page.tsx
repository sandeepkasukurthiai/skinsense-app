import { formatDate } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { Empty, PageHeader, Skeleton } from "@/components/ui";
import { requireStaff } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export default function PatientsPage({ searchParams }: PageProps<"/patients">) {
  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Patients"
        actions={
          <Link href="/patients/new" className="btn">
            Register patient
          </Link>
        }
      />
      <Suspense fallback={<Skeleton rows={8} />}>
        <PatientList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PatientList({ searchParams }: { searchParams: PageProps<"/patients">["searchParams"] }) {
  await requireStaff();
  const q = String((await searchParams).q ?? "").trim();
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("id, full_name, phone, dob, presenting_concern, created_at, auth_user_id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe.replace(/\D/g, "") || safe}%`);
  }
  const { data, error } = await query;

  return (
    <div className="space-y-4">
      <form className="flex max-w-md gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Search patients
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name or phone" className="field" />
        <button className="btn-ghost">Search</button>
      </form>
      {error ? <p className="text-sm text-danger">{error.message}</p> : null}
      {!data?.length ? (
        <Empty title={q ? "No matches" : "No patients yet"} body={q ? "Try part of the name or the last digits of the phone." : undefined} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Concern</th>
                <th>App</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/patients/${p.id}`} className="font-medium">
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">{p.phone}</td>
                  <td className="text-muted">{p.presenting_concern ?? "—"}</td>
                  <td>{p.auth_user_id ? "Linked" : <span className="text-muted">—</span>}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(p.created_at, { weekday: undefined, year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
