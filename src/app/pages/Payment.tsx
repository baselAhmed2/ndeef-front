import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  ApiError,
  getOrderByIdRequest,
  processPaymentRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

type FlowState = "loading" | "invalid" | "processing" | "failed";

function FailedScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <XCircle size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">Payment Failed</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all mb-3 mt-6"
      >
        Try Again
      </button>
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        Cancel
      </Link>
    </div>
  );
}

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthReady, isLoggedIn } = useAuth();
  const orderId = searchParams?.get("orderId") ?? "";

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [failureMessage, setFailureMessage] = useState(
    "Could not open the cashier page right now.",
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=/payment");
    }
  }, [isAuthReady, isLoggedIn, router]);

  const openCashier = async () => {
    if (!user?.token || !orderId) return;

    try {
      setFlowState("processing");

      const order = await getOrderByIdRequest(user.token, orderId);
      const response = await processPaymentRequest(
        user.token,
        {
          orderId: Number(orderId),
          amount: Number(order.totalPrice ?? 0),
          paymentMethod: "CreditCard",
        },
      );
      const cashierUrl = response.paymentUrl;

      if (!cashierUrl) {
        throw new ApiError(
          "Backend did not return a cashier URL for card payment.",
          500,
          response,
        );
      }

      window.location.assign(cashierUrl);
    } catch (error) {
      setFailureMessage(
        error instanceof ApiError
          ? error.message
          : "Could not open the cashier page right now.",
      );
      setFlowState("failed");
    }
  };

  useEffect(() => {
    if (!user?.token || !orderId) {
      setFlowState("invalid");
      return;
    }
    openCashier();
  }, [orderId, user?.token]);

  const handleRetry = () => {
    openCashier();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {flowState !== "failed" && (
        <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              disabled={flowState === "processing"}
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 text-lg">Secure Payment</h1>
              <div className="flex items-center gap-1">
                <Lock size={11} className="text-emerald-500" strokeWidth={2.5} />
                <p className="text-xs text-emerald-600">
                  Backend payment confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {flowState === "loading" && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Loading order summary...</p>
        </div>
      )}

      {flowState === "invalid" && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
          <AlertCircle size={36} className="text-red-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-1">Invalid payment request</p>
          <p className="text-gray-400 text-sm mb-6">
            No valid backend order was found for this payment screen.
          </p>
          <Link href="/nearby" className="text-[#1D6076] text-sm underline">
            Browse Laundries
          </Link>
        </div>
      )}

      {(flowState === "processing" || flowState === "loading") && (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
            <Loader2 size={36} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-2">Redirecting to Kashier...</h2>
          <p className="text-gray-400 text-sm">Please don&apos;t close this page</p>
        </div>
      )}
      {flowState === "failed" && (
        <FailedScreen message={failureMessage} onRetry={handleRetry} />
      )}
    </div>
  );
}
