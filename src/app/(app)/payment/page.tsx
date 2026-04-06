"use client";

import { Suspense } from "react";
import Payment from "@/app/pages/Payment";

export default function Page() {
  return (
    <Suspense>
      <Payment />
    </Suspense>
  );
}
