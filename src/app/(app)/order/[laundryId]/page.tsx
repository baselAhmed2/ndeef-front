"use client";

import { Suspense } from "react";
import OrderPage from "@/app/pages/OrderPage";

export default function Page() {
  return (
    <Suspense>
      <OrderPage />
    </Suspense>
  );
}
