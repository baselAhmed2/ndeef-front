"use client";

import { Suspense } from "react";
import TrackOrder from "@/app/pages/TrackOrder";

export default function Page() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  );
}
