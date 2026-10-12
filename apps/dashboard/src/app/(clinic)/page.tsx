import { greeting, roleProfiles } from "@skinsense/shared";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader, Skeleton } from "@/components/ui";
import { requireStaff } from "@/lib/dal";

import { BillsDue, BusinessNumbers, CourseMetrics, DayBoard, Dispensary, Team, TodayNumbers } from "./home-sections";

/** Every role lands here; what it shows depends on who signed in. */
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton rows={2} />
          <Skeleton rows={6} />
        </div>
      }
    >
      <RoleHome />
    </Suspense>
  );
}

async function RoleHome() {
  const me = await requireStaff();
  const profile = roleProfiles[me.role];
  const firstName = me.name.replace(/^Dr\.?\s*/, "").split(" ")[0];

  const book = (
    <Link href="/appointments" className="btn">
      New appointment
    </Link>
  );

  return (
    <>
      <PageHeader
        eyebrow={`${greeting()}, ${me.role === "owner" || me.role === "doctor" ? `Dr. ${firstName}` : firstName} · ${profile.portal}`}
        title={profile.title}
        actions={["owner", "front_desk", "centre_manager", "doctor"].includes(me.role) ? book : undefined}
      />
      <div className="space-y-10">
        {me.role === "owner" ? (
          <>
            <BusinessNumbers />
            <CourseMetrics />
            <DayBoard />
            <Team />
          </>
        ) : null}

        {me.role === "doctor" ? (
          <>
            <DayBoard providerId={me.id} title="Your list today" />
            <CourseMetrics />
          </>
        ) : null}

        {me.role === "staff" ? <DayBoard floorOnly title="On the floor now and next" /> : null}

        {me.role === "front_desk" ? (
          <>
            <TodayNumbers />
            <DayBoard />
            <BillsDue />
          </>
        ) : null}

        {me.role === "pharmacy" ? <Dispensary days={14} linkPatients={false} /> : null}

        {me.role === "centre_manager" ? (
          <>
            <TodayNumbers />
            <DayBoard />
            <BillsDue />
          </>
        ) : null}

        {me.role === "operations_head" ? (
          <>
            <BusinessNumbers />
            <CourseMetrics />
            <DayBoard canAct={false} />
          </>
        ) : null}
      </div>
    </>
  );
}
