"use client";

import { Suspense } from "react";
import Home from "@/app/pages/Home";

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
