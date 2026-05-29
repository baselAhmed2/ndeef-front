"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  XCircle,
  Loader2,
  AlertCircle,
  CreditCard,
  Wallet,
} from "lucide-react";
import {
  ApiError,
  getOrderByIdRequest,
  getWalletInfoRequest,
  processPaymentRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

type FlowState = "loading" | "ready" | "processing" | "failed" | "invalid";
type SelectedMethod = "card" | "wallet";

async function openExternalUrl(url: string) {
  const capacitor = typeof window !== "undefined" ? (window as typeof window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        Browser?: {
          open?: (options: { url: string }) => Promise<void>;
        };
      };
    };
  }).Capacitor : undefined;

  if (capacitor?.isNativePlatform?.() && capacitor.Plugins?.Browser?.open) {
    await capacitor.Plugins.Browser.open({ url });
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
}

function formatMoney(amount: number) {
  return `${amount.toFixed(2)} EGP`;
}

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthReady, isLoggedIn } = useAuth();
  const orderId = searchParams?.get("orderId") ?? "";
  const status = searchParams?.get("status") ?? "";

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [failureMessage, setFailureMessage] = useState(
    status === "failed" ? "Payment failed. Please try again." : "Could not prepare payment right now.",
  );
  const [orderTotal, setOrderTotal] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod>("card");

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=/payment");
    }
  }, [isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    const token = user?.token ?? null;
    if (!token || !orderId) {
      setFlowState("invalid");
      return;
    }
    const authToken = token;

    let active = true;

    async function loadPaymentContext() {
      try {
        setFlowState("loading");
        const [order, walletInfo] = await Promise.all([
          getOrderByIdRequest(authToken, orderId),
          getWalletInfoRequest(authToken).catch(() => ({
            balance: 0,
            totalCharged: 0,
            isActive: true,
            transactions: [],
          })),
        ]);

        if (!active) return;

        setOrderTotal(Number(order.totalPrice ?? 0));
        setWalletBalance(Number(walletInfo.balance ?? 0));
        setSelectedMethod(Number(walletInfo.balance ?? 0) >= Number(order.totalPrice ?? 0) ? "wallet" : "card");
        setFlowState(status === "failed" ? "failed" : "ready");
      } catch (error) {
        if (!active) return;
        setFailureMessage(
          error instanceof ApiError ? error.message : "Could not prepare payment right now.",
        );
        setFlowState("failed");
      }
    }

    void loadPaymentContext();
    return () => {
      active = false;
    };
  }, [orderId, status, user?.token]);

  const remainingAfterWallet = useMemo(
    () => Math.max(0, orderTotal - walletBalance),
    [orderTotal, walletBalance],
  );

  const walletCanCoverOrder = walletBalance >= orderTotal && orderTotal > 0;

  const handlePay = async () => {
    if (!user?.token || !orderId) return;

    try {
      setFlowState("processing");

      const payload =
        selectedMethod === "wallet"
          ? {
              orderId: Number(orderId),
              amount: orderTotal,
              paymentMethod: "Wallet" as const,
            }
          : {
              orderId: Number(orderId),
              amount: orderTotal,
              paymentMethod: "CreditCard" as const,
            };

      const response = await processPaymentRequest(user.token, payload);

      if (selectedMethod === "wallet") {
        router.replace(`/track-order/${orderId}?notice=paid`);
        return;
      }

      const cashierUrl = response.paymentUrl;
      if (!cashierUrl) {
        throw new ApiError(
          "Backend did not return a cashier URL for card payment.",
          500,
          response,
        );
      }

      await openExternalUrl(cashierUrl);
    } catch (error) {
      setFailureMessage(
        error instanceof ApiError
          ? error.message
          : "Could not open the cashier page right now.",
      );
      setFlowState("failed");
    }
  };

  if (flowState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <Loader2 size={30} className="animate-spin text-[#1D6076]" strokeWidth={1.5} />
      </div>
    );
  }

  if (flowState === "invalid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] px-8 text-center">
        <AlertCircle size={36} className="mb-4 text-red-400" strokeWidth={1.5} />
        <p className="mb-1 text-gray-700">Invalid payment request</p>
        <p className="mb-6 text-sm text-gray-400">No valid backend order was found for this payment screen.</p>
        <Link href="/nearby" className="text-sm text-[#1D6076] underline">
          Browse Laundries
        </Link>
      </div>
    );
  }

  if (flowState === "failed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle size={36} className="text-red-400" strokeWidth={1.5} />
        </div>
        <h2 className="mb-3 text-xl text-gray-900">Payment Failed</h2>
        <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-500">{failureMessage}</p>
        <button
          onClick={() => setFlowState("ready")}
          className="mb-3 w-full max-w-xs rounded-2xl bg-[#1D6076] py-4 text-sm font-medium text-white transition hover:bg-[#2a7a94]"
        >
          Try Again
        </button>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      <div className="sticky top-16 z-20 border-b border-gray-100 bg-white px-4 py-4 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl p-2 transition-all hover:bg-gray-50 active:scale-95"
            disabled={flowState === "processing"}
          >
            <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-gray-900">Secure Payment</h1>
            <div className="flex items-center gap-1">
              <Lock size={11} className="text-emerald-500" strokeWidth={2.5} />
              <p className="text-xs text-emerald-600">Backend payment confirmation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Payment summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Order total</span>
              <span className="font-semibold text-gray-900">{formatMoney(orderTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Wallet balance</span>
              <span className="font-semibold text-gray-900">{formatMoney(walletBalance)}</span>
            </div>
            {!walletCanCoverOrder ? (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Remaining if using wallet only</span>
                <span className="font-semibold text-amber-700">{formatMoney(remainingAfterWallet)}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Choose payment method</h2>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                selectedMethod === "card"
                  ? "border-[#1D6076] bg-[#1D6076]/5"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2.5">
                <CreditCard size={16} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-sm font-medium text-gray-900">Credit Card</p>
              </div>
              <p className="text-xs text-gray-500">
                Pay the full order using Kashier card checkout.
              </p>
            </button>

            <button
              type="button"
              onClick={() => walletCanCoverOrder && setSelectedMethod("wallet")}
              disabled={!walletCanCoverOrder}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                selectedMethod === "wallet"
                  ? "border-[#1D6076] bg-[#1D6076]/5"
                  : "border-gray-200 bg-gray-50"
              } ${walletCanCoverOrder ? "hover:bg-gray-100" : "cursor-not-allowed opacity-60"}`}
            >
              <div className="mb-1.5 flex items-center gap-2.5">
                <Wallet size={16} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-sm font-medium text-gray-900">Wallet</p>
              </div>
              <p className="text-xs text-gray-500">
                {walletCanCoverOrder
                  ? "Your wallet can cover this order بالكامل."
                  : `Wallet is short by ${formatMoney(remainingAfterWallet)}. Full wallet payment only is supported for regular orders.`}
              </p>
            </button>
          </div>

          {!walletCanCoverOrder ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              For normal orders, the current backend supports wallet payment only when the wallet covers the full total. Split payment from wallet + card is not available here yet.
            </div>
          ) : null}

          <button
            onClick={() => void handlePay()}
            disabled={flowState === "processing"}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D6076] py-4 text-sm font-medium text-white transition hover:bg-[#2a7a94] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {flowState === "processing" ? (
              <>
                <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                Processing...
              </>
            ) : (
              <>
                {selectedMethod === "wallet" ? "Pay with Wallet" : "Continue to Card Checkout"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
