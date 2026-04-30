"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams?.get("status") ?? "";
    const merchantOrderId = searchParams?.get("merchantOrderId") ?? "";

    if (merchantOrderId.startsWith("commission-")) {
      const nextStatus = status === "success" ? "success" : "failed";
      router.replace(
        `/laundry-admin/payments?payment=${encodeURIComponent(nextStatus)}&merchantOrderId=${encodeURIComponent(merchantOrderId)}`,
      );
      return;
    }

    if (merchantOrderId.startsWith("order-")) {
      const orderId = merchantOrderId.split("-")[1];
      if (orderId) {
        router.replace(`/track-order/${orderId}`);
        return;
      }
    }

    router.replace("/");
  }, [router, searchParams]);

  return null;
}
