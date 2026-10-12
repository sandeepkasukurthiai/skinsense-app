import { Suspense } from "react";

import { PageHeader, Skeleton } from "@/components/ui";
import { requireStaff, rolesFor } from "@/lib/dal";

import { Dispensary } from "../home-sections";

export default function PrescriptionsPage() {
  return (
    <>
      <PageHeader eyebrow="Pharmacy" title="Dispensary" />
      <Suspense fallback={<Skeleton rows={8} />}>
        <Gate />
      </Suspense>
    </>
  );
}

async function Gate() {
  await requireStaff(rolesFor("prescriptions"));
  return <Dispensary days={60} />;
}
