"use client";

import { Suspense } from "react";
import Orders from "@/app/pages/Orders";

export default function Page() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}
