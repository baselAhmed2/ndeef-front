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
  WalletCards,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  ApiError,
  getOrderByIdRequest,
  getWalletInfoRequest,
  processPaymentRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

type FlowState = "loading" | "ready" | "processing" | "failed" | "invalid";

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

  // الخصم التلقائي من المحفظة
  const walletDeduction = useMemo(
    () => Math.min(walletBalance, orderTotal),
    [orderTotal, walletBalance],
  );

  const amountDue = useMemo(
    () => Math.max(0, orderTotal - walletDeduction),
    [orderTotal, walletDeduction],
  );

  const walletCoversAll = walletDeduction > 0 && amountDue === 0;

  const handlePay = async () => {
    if (!user?.token || !orderId) return;

    try {
      setFlowState("processing");

      const payload = {
        orderId: Number(orderId),
        amount: orderTotal,
        paymentMethod: "CreditCard" as const,
      };

      const response = await processPaymentRequest(user.token, payload);

      // لو المحفظة غطّت الكل — الأوردر اتأكد تلقائياً
      if (!response.paymentUrl) {
        router.replace(`/track-order/${orderId}?notice=paid`);
        return;
      }

      // فيه فرق — افتح Kashier
      await openExternalUrl(response.paymentUrl);
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
      {/* Header */}
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

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 space-y-4">

        {/* Wallet Auto-Deduction Banner */}
        {walletDeduction > 0 && (
          <div className={`rounded-3xl border px-5 py-4 flex items-start gap-3 ${
            walletCoversAll
              ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"
              : "border-sky-200 bg-gradient-to-r from-sky-50 to-white"
          }`}>
            <div className={`rounded-2xl p-2 ${walletCoversAll ? "bg-emerald-100 text-emerald-600" : "bg-sky-100 text-sky-600"}`}>
              {walletCoversAll ? <CheckCircle2 size={18} strokeWidth={2} /> : <Sparkles size={18} strokeWidth={2} />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${walletCoversAll ? "text-emerald-800" : "text-sky-800"}`}>
                {walletCoversAll
                  ? "Your wallet covers the full order!"
                  : `Wallet saving you ${formatMoney(walletDeduction)}`}
              </p>
              <p className={`mt-0.5 text-xs ${walletCoversAll ? "text-emerald-600" : "text-sky-600"}`}>
                {walletCoversAll
                  ? "No card needed — your order will be confirmed instantly."
                  : `${formatMoney(walletDeduction)} deducted automatically from your wallet. Pay only ${formatMoney(amountDue)}.`}
              </p>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Payment summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Order total</span>
              <span className="font-semibold text-gray-900">{formatMoney(orderTotal)}</span>
            </div>

            {walletDeduction > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <WalletCards size={13} className="text-emerald-500" />
                  Wallet deduction
                </span>
                <span className="font-semibold text-emerald-600">−{formatMoney(walletDeduction)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="font-semibold text-gray-700">Amount due</span>
              <span className="text-lg font-bold text-gray-900">{formatMoney(amountDue)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method (only shown when there's something to pay) */}
        {!walletCoversAll && amountDue > 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Payment method</h2>
            <div className="mt-4 rounded-2xl border border-[#1D6076]/20 bg-[#1D6076]/5 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-sm font-medium text-gray-900">Credit / Debit Card</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                You will be redirected to Kashier to pay <span className="font-semibold text-gray-800">{formatMoney(amountDue)}</span> securely.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => void handlePay()}
          disabled={flowState === "processing"}
          className="w-full rounded-3xl bg-[#1D6076] py-4 text-sm font-semibold text-white shadow-lg shadow-[#1D6076]/20 transition hover:bg-[#2a7a94] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {flowState === "processing" ? (
            <>
              <Loader2 size={18} className="animate-spin" strokeWidth={2} />
              Processing...
            </>
          ) : walletCoversAll ? (
            <>
              <CheckCircle2 size={16} strokeWidth={2.5} />
              Confirm Order — Free via Wallet
            </>
          ) : (
            <>
              <CreditCard size={16} strokeWidth={2} />
              Pay {formatMoney(amountDue)} with Card
            </>
          )}
        </button>
      </div>
    </div>
  );
}
