import type { Metadata } from "next";
import { Suspense } from "react";

import { Entrance } from "./entrance";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="lux-glow min-h-screen" />}>
      <Entrance />
    </Suspense>
  );
}
