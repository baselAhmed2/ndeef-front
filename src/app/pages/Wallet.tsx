"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { chargeWalletRequest, getWalletInfoRequest } from "../lib/api";

type WalletTransaction = {
  id: number;
  title: string;
  amount: number;
  amountLabel: string;
  time: string;
  createdAt: string | null;
  positive: boolean;
  paymentMethod: string;
  paymentStatus: string;
  source: string;
};

type ActivityFilter = "all" | "wallet" | "mobile" | "cash" | "refund";
type WalletSyncState = "idle" | "waiting" | "confirmed" | "failed" | "timeout";
type PendingWalletCharge = {
  amount: number;
  startedAt: string;
};

const QUICK_AMOUNTS = [100, 250, 500, 1000] as const;
const PENDING_WALLET_CHARGE_KEY = "nazeef_pending_wallet_charge";

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

  window.location.href = url;
}

function formatMoney(amount: number) {
  return `${amount.toFixed(2)} EGP`;
}

function formatTransactionDate(value: string | null | undefined) {
  if (!value) return "Pending transaction";

  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMethodFromSource(source: string) {
  const normalized = String(source || "").toLowerCase();
  if (normalized.includes("refund")) return "Refund";
  if (normalized.includes("mobile")) return "MobilePayment";
  if (normalized.includes("cash")) return "Cash";
  return "Wallet";
}

function getFilterForTransaction(method: string, source: string): ActivityFilter {
  const normalizedSource = String(source || "").toLowerCase();
  if (normalizedSource.includes("refund")) return "refund";

  switch (method) {
    case "Wallet":
      return "wallet";
    case "MobilePayment":
      return "mobile";
    case "Cash":
      return "cash";
    case "Refund":
      return "refund";
    default:
      return "all";
  }
}

function getMethodChipClass(method: string) {
  switch (method) {
    case "Wallet":
      return "bg-emerald-50 text-emerald-700";
    case "MobilePayment":
      return "bg-sky-50 text-sky-700";
    case "Cash":
      return "bg-amber-50 text-amber-700";
    case "Refund":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getStatusChipClass(status: string) {
  switch (String(status).toLowerCase()) {
    case "completed":
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "failed":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function inferTransactionTitle(source: string, type: string) {
  const normalizedSource = String(source || "").toLowerCase();
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedSource.includes("walletcharge")) return "Wallet Charge";
  if (normalizedSource.includes("walletpayment")) {
    return normalizedType === "debit" ? "Wallet Payment" : "Wallet Credit";
  }
  if (normalizedSource.includes("refund")) return "Refund to Wallet";
  if (normalizedSource.includes("mobilewallet")) return "Mobile Wallet Payment";
  if (normalizedSource.includes("cashpayment")) return "Cash Payment";
  return "Wallet Activity";
}

function readPendingWalletCharge(): PendingWalletCharge | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_WALLET_CHARGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingWalletCharge;
    if (!Number.isFinite(parsed.amount) || !parsed.startedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePendingWalletCharge(payload: PendingWalletCharge) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_WALLET_CHARGE_KEY, JSON.stringify(payload));
}

function clearPendingWalletCharge() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_WALLET_CHARGE_KEY);
}

function hasMatchingWalletCharge(
  items: WalletTransaction[],
  pendingCharge: PendingWalletCharge | null,
) {
  if (!pendingCharge) return false;

  const startedAt = new Date(pendingCharge.startedAt).getTime();
  const earliestAcceptedTime = startedAt - 2 * 60 * 1000;

  return items.some((item) => {
    const source = item.source.toLowerCase();
    const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    return (
      source.includes("walletcharge") &&
      item.positive &&
      Math.abs(Math.abs(item.amount) - pendingCharge.amount) < 0.01 &&
      createdAt >= earliestAcceptedTime
    );
  });
}

export default function Wallet() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletActive, setWalletActive] = useState(true);
  const [totalCharged, setTotalCharged] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [chargeAmount, setChargeAmount] = useState("250");
  const [syncState, setSyncState] = useState<WalletSyncState>("idle");
  const chargeStatus = searchParams?.get("status");
  const [pendingCharge, setPendingCharge] = useState<PendingWalletCharge | null>(null);
  const normalizedRole = String(user?.role ?? "").trim().toLowerCase().replace(/\s+/g, "");
  const isCustomerRole = !normalizedRole || normalizedRole === "customer" || normalizedRole === "1";

  const loadWalletInfo = useCallback(async (authToken: string) => {
    const walletInfo = await getWalletInfoRequest(authToken);

    const mapped = (walletInfo.transactions ?? []).map((item) => {
      const amount = Number(item.amount ?? 0);
      const source = String(item.source || "");
      const type = String(item.type || "");
      const status = String(item.status || "");
      const method = getMethodFromSource(source);
      const positive = type.toLowerCase() === "credit";

      return {
        id: item.id,
        title: inferTransactionTitle(source, type),
        amount: positive ? amount : -amount,
        amountLabel: `${positive ? "+" : "-"}${formatMoney(amount)}`,
        time: formatTransactionDate(item.createdAt),
        createdAt: item.createdAt ?? null,
        positive,
        paymentMethod: method,
        paymentStatus: status,
        source,
      };
    });

    setWalletBalance(Number(walletInfo.balance ?? 0));
    setWalletActive(Boolean(walletInfo.isActive ?? true));
    setTotalCharged(Number(walletInfo.totalCharged ?? 0));
    setTransactions(mapped);

    return mapped;
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    const token = user?.token ?? null;
    if (!token) {
      setLoading(false);
      return;
    }
    const authToken = token;

    let active = true;

    async function loadWalletPage() {
      try {
        setLoading(true);
        const pending = readPendingWalletCharge();
        setPendingCharge(pending);
        await loadWalletInfo(authToken);
        if (!active) return;
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Failed to load wallet activity.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWalletPage();
    return () => {
      active = false;
    };
  }, [chargeStatus, isAuthReady, loadWalletInfo, user?.token]);

  useEffect(() => {
    if (!user?.token || !chargeStatus) return;

    if (chargeStatus === "failed") {
      clearPendingWalletCharge();
      setPendingCharge(null);
      setSyncState("failed");
      return;
    }

    if (chargeStatus !== "success") return;

    let cancelled = false;
    let attempts = 0;
    const activePendingCharge = readPendingWalletCharge();
    setPendingCharge(activePendingCharge);
    setSyncState("waiting");

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const mapped = await loadWalletInfo(user.token);
        if (cancelled) return;

        if (hasMatchingWalletCharge(mapped, activePendingCharge)) {
          clearPendingWalletCharge();
          setPendingCharge(null);
          setSyncState("confirmed");
          return;
        }

        if (attempts >= 8) {
          setSyncState("timeout");
          return;
        }

        window.setTimeout(() => {
          void poll();
        }, 3000);
      } catch {
        if (!cancelled && attempts >= 8) {
          setSyncState("timeout");
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [chargeStatus, loadWalletInfo, user?.token]);

  useEffect(() => {
    if (!chargeStatus) return;
    if (chargeStatus === "success") {
      toast.success("Wallet charge completed successfully.");
    } else if (chargeStatus === "failed") {
      toast.error("Wallet charge did not complete successfully.");
    }

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("status");
    const nextQuery = params.toString();
    const timeout = window.setTimeout(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [chargeStatus, pathname, router, searchParams]);

  const refundsTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.source.toLowerCase().includes("refund"))
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter(
      (transaction) => getFilterForTransaction(transaction.paymentMethod, transaction.source) === filter,
    );
  }, [filter, transactions]);

  const handleChargeWallet = async () => {
    if (!user?.token || charging) return;

    const amount = Number(chargeAmount);
    if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
      toast.error("Amount must be between 10 and 10000 EGP.");
      return;
    }

    try {
      setCharging(true);
      writePendingWalletCharge({
        amount,
        startedAt: new Date().toISOString(),
      });
      setPendingCharge({
        amount,
        startedAt: new Date().toISOString(),
      });
      setSyncState("waiting");
      const response = await chargeWalletRequest(user.token, amount);
      const checkoutUrl = response.checkoutUrl ?? response.paymentUrl;

      if (!checkoutUrl) {
        throw new Error("Backend did not return a checkout URL.");
      }

      await openExternalUrl(checkoutUrl);
    } catch (error) {
      clearPendingWalletCharge();
      setPendingCharge(null);
      setSyncState("idle");
      toast.error(error instanceof Error ? error.message : "Failed to start wallet charge.");
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1D6076]" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (isAuthReady && !user?.token) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Please log in to access your wallet.</p>
          <Link
            href="/login?from=/wallet"
            className="mt-4 inline-flex rounded-xl bg-[#1D6076] px-4 py-3 text-white font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isAuthReady && user?.token && !isCustomerRole) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-amber-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <WalletIcon size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet charge returned to a non-customer session</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            This browser is currently signed in as <span className="font-semibold text-gray-900">{user.role}</span>, so the customer wallet page cannot open here.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            If the charge was started from a customer account on another session or device, sign in here with that same customer account to see the updated wallet balance.
          </p>
          {chargeStatus ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Payment gateway returned status: <span className="font-semibold">{chargeStatus}</span>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?role=Customer&from=/wallet"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1D6076] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164d5f]"
            >
              Sign in as Customer
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white" dir="ltr">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-orange-500/5 blur-[150px] pointer-events-none" />

      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:scale-105 hover:bg-white/10 hover:text-white active:scale-95"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Digital Wallet</h1>
              <p className="hidden sm:block text-xs text-slate-400 mt-0.5">Manage your balance, cards, and transaction history</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => void (user?.token ? loadWalletInfo(user.token) : Promise.resolve())}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <RefreshCw size={14} className="animate-hover-spin" strokeWidth={2.5} />
            Sync Balance
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Status Messages Portal */}
        <div className="space-y-3">
          {chargeStatus === "success" && (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-950/30 p-5 backdrop-blur-md">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-300">Transaction Confirmed!</p>
                  <p className="mt-1 text-xs text-emerald-400/80 leading-relaxed">
                    Your payment was verified. The charged funds have been securely credited to your digital balance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {syncState === "waiting" && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-950/30 p-5 backdrop-blur-md">
              <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                  <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-300">Awaiting Webhook Confirmation</p>
                  <p className="mt-1 text-xs text-amber-400/80 leading-relaxed">
                    {pendingCharge
                      ? `We are verifying your deposit of ${formatMoney(pendingCharge.amount)} with the payment processor. Hang tight, this will update automatically!`
                      : "We're validating your checkout session. Your balance will show up shortly."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {syncState === "confirmed" && (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-950/30 p-5 backdrop-blur-md">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-300">Balance Synchronized Successfully</p>
                  <p className="mt-1 text-xs text-emerald-400/80 leading-relaxed">
                    Your active digital wallet balance was updated. All transactions match the latest backend records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {chargeStatus === "failed" && (
            <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-rose-950/30 p-5 backdrop-blur-md">
              <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                  <XCircle size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-300">Payment Unsuccessful</p>
                  <p className="mt-1 text-xs text-rose-400/80 leading-relaxed">
                    The payment processor reported an issue processing your transaction. No charges were made to your card. Please retry.
                  </p>
                </div>
              </div>
            </div>
          )}

          {syncState === "timeout" && (
            <div className="relative overflow-hidden rounded-3xl border border-rose-500/25 bg-rose-950/20 p-5 backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                  <Clock3 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-300">Confirmation Delay</p>
                  <p className="mt-1 text-xs text-rose-400/80 leading-relaxed">
                    The transaction is taking slightly longer to reflect. Click "Sync Balance" to retry or contact our support team.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dual Primary Hero Cards Grid */}
        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          
          {/* Card Presentation Section (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-[32px] border border-white/5 bg-gradient-to-b from-white/10 to-transparent p-6 shadow-2xl backdrop-blur-md relative overflow-hidden group">
            {/* Glossy Overlay Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-teal-400/90">Premium Member</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300">
                Ndeef Pay
              </span>
            </div>

            {/* The Visual Masterpiece: Premium Visa Card representation */}
            <div className="relative w-full aspect-[1.586/1] rounded-[24px] overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.01] group-hover:shadow-teal-500/5 bg-gradient-to-tr from-[#0F5A67] via-[#107B88] to-[#EE8033] p-6 text-white flex flex-col justify-between border border-white/10">
              
              {/* Card Holographic / Glossy Shimmer Sheet */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:left-[150%] transition-all duration-1000 ease-out pointer-events-none" />
              
              {/* Custom Bubble & Ndeef Character Watermark from original image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-25 rounded-full border border-white/10 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-36 rounded-full border border-white/10 bg-teal-600/20 backdrop-blur-xs flex items-center justify-center">
                  {/* Creative Mascot SVG rendering */}
                  <svg className="w-16 h-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>

              {/* Card Top Row: EMV Chip & Contactless Indicator */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  {/* Exquisite Realistic EMV Chip */}
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 relative overflow-hidden shadow-md flex flex-col justify-around p-1">
                    <div className="w-full h-[1px] bg-slate-900/10" />
                    <div className="w-full h-[1px] bg-slate-900/10" />
                    <div className="absolute inset-y-0 left-1/3 w-[1px] bg-slate-900/10" />
                    <div className="absolute inset-y-0 right-1/3 w-[1px] bg-slate-900/10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-xs border border-slate-900/20 bg-amber-300" />
                  </div>
                  {/* Tap-to-Pay Waves */}
                  <svg className="w-6 h-6 text-white/85 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 8a9 9 0 0 1 0 8M8 10a5 5 0 0 1 0 4M11 12a1 1 0 0 1 0 .01" />
                  </svg>
                </div>
                
                {/* Embedded Metallic Visa Logo */}
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-extrabold italic tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    VISA
                  </span>
                  <span className="text-[7px] tracking-[0.4em] uppercase font-bold text-white/80 -mt-1 mr-0.5">Platinum</span>
                </div>
              </div>

              {/* Card Middle Row: Sophisticated Balance Typography */}
              <div className="my-auto py-1 relative z-10">
                <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-white/70">Available Balance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
                    {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-semibold uppercase text-teal-200">EGP</span>
                </div>
              </div>

              {/* Card Bottom Row: Cardholder Details & Status */}
              <div className="flex items-end justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[8px] uppercase tracking-wider text-white/60">Card Holder</p>
                  <p className="text-sm font-semibold tracking-wide text-white truncate max-w-[200px]">
                    {user?.name || "Ndeef Customer"}
                  </p>
                </div>
                
                <div className="flex gap-8">
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] uppercase tracking-wider text-white/60">Expires</p>
                    <p className="text-xs font-semibold tracking-wide text-white font-mono">12/30</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] uppercase tracking-wider text-white/60">CVC</p>
                    <p className="text-xs font-semibold tracking-wide text-white font-mono">•••</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recharge Terminal Section (5 Cols) */}
          <div className="lg:col-span-5 rounded-[32px] border border-white/5 bg-white/[0.03] p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recharge Balance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top-up instantly using payment methods</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Numeric Dial Input Container */}
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold text-slate-400">EGP</span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={chargeAmount}
                    onChange={(event) => setChargeAmount(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-14 pr-4 text-lg font-bold text-white outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.08]"
                  />
                </div>

                {/* Quick Selection Amounts Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((amount) => {
                    const isSelected = Number(chargeAmount) === amount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setChargeAmount(String(amount))}
                        className={`h-11 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 scale-[1.03]"
                            : "bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        +{amount}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={() => void handleChargeWallet()}
                disabled={charging}
                className="w-full h-13 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              >
                {charging ? (
                  <>
                    <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                    <span>Initiating Checkout...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Recharge Now</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck size={12} className="text-teal-400" strokeWidth={2.5} />
                <span>Secured end-to-end encryption by Kashier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Analytics & Info Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Box 1: Balance Status */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-16 w-16 bg-teal-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <WalletIcon size={18} strokeWidth={2.5} />
            </div>
            <p className="text-xs text-slate-400 font-medium">Available Cash Balance</p>
            <p className="mt-2 text-xl font-bold tracking-tight text-white font-mono">{formatMoney(walletBalance)}</p>
            <p className="mt-1 text-[10px] text-slate-500">Instantly spendable on cleaning services.</p>
          </div>

          {/* Box 2: Total Charges */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-16 w-16 bg-orange-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <p className="text-xs text-slate-400 font-medium">Accumulated Deposits</p>
            <p className="mt-2 text-xl font-bold tracking-tight text-white font-mono">{formatMoney(totalCharged)}</p>
            <p className="mt-1 text-[10px] text-slate-500">Lifetime wallet recharges recorded.</p>
          </div>

          {/* Box 3: Refunds Returned */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Clock3 size={18} strokeWidth={2.5} />
            </div>
            <p className="text-xs text-slate-400 font-medium">Refund Claims</p>
            <p className="mt-2 text-xl font-bold tracking-tight text-white font-mono">{formatMoney(refundsTotal)}</p>
            <p className="mt-1 text-[10px] text-slate-500">Returned credits on cancelled orders.</p>
          </div>
        </div>

        {/* Ledger Transaction History */}
        <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-5 sm:p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Transaction Logs</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time statements from database records</p>
            </div>

            {/* Filter Tabs Container */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-white/5">
              {([
                ["all", "All"],
                ["wallet", "Wallet"],
                ["mobile", "Mobile"],
                ["cash", "Cash"],
                ["refund", "Refunds"],
              ] as const).map(([value, label]) => {
                const isActive = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Records Output */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-4 py-12 text-center text-xs text-slate-500">
                No transaction records matching this filter were found.
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const statusLower = transaction.paymentStatus.toLowerCase();
                const isSuccess = statusLower === "completed" || statusLower === "paid";
                const isFail = statusLower === "failed";
                
                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.01] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-white">{transaction.title}</p>
                        
                        {/* Chip payment method */}
                        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold ${getMethodChipClass(transaction.paymentMethod)}`}>
                          {transaction.paymentMethod}
                        </span>

                        {/* Chip payment status */}
                        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold ${getStatusChipClass(transaction.paymentStatus)}`}>
                          {transaction.paymentStatus}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 font-medium">{transaction.time}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-white/5 pt-2 sm:border-t-0 sm:pt-0">
                      <span className={`text-xs font-bold font-mono ${transaction.positive ? "text-emerald-400" : "text-slate-300"}`}>
                        {transaction.amountLabel}
                      </span>
                      
                      {isFail ? (
                        <XCircle className="h-4.5 w-4.5 text-rose-400" strokeWidth={2.5} />
                      ) : isSuccess ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" strokeWidth={2.5} />
                      ) : (
                        <Loader2 className="h-4.5 w-4.5 text-amber-400 animate-spin" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
