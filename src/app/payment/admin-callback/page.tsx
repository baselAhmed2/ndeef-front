"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminPaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams?.get("status") ?? "";
    const merchantOrderId = searchParams?.get("merchantOrderId") ?? "";
    const nextStatus = status.toLowerCase() === "success" ? "success" : "failed";

    if (merchantOrderId.startsWith("commission-")) {
      window.location.replace(
        `/laundry-admin/payments?payment=${encodeURIComponent(nextStatus)}&merchantOrderId=${encodeURIComponent(merchantOrderId)}`,
      );
      return;
    }

    router.replace("/laundry-admin/payments");
  }, [router, searchParams]);

  return null;
}
