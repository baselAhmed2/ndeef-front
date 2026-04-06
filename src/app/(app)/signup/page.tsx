"use client";

import { Suspense } from "react";
import SignupPage from "@/app/pages/SignupPage";

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}
