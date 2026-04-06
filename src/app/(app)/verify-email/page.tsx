"use client";

import { Suspense } from "react";
import VerifyEmail from "@/app/pages/VerifyEmail";

export default function Page() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
