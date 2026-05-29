"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Plus,
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
  positive: boolean;
  paymentMethod: string;
  paymentStatus: string;
  source: string;
};

type ActivityFilter = "all" | "wallet" | "mobile" | "cash" | "refund";

const QUICK_AMOUNTS = [100, 250, 500, 1000] as const;

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

export default function Wallet() {
  const { user, isAuthReady } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletActive, setWalletActive] = useState(true);
  const [totalCharged, setTotalCharged] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [chargeAmount, setChargeAmount] = useState("250");
  const chargeStatus = searchParams?.get("status");

  useEffect(() => {
    if (!isAuthReady) return;
    const token = user?.token ?? null;
    if (!token) {
      setLoading(false);
      return;
    }
    const authToken = token;

    let active = true;

    async function loadWalletInfo() {
      try {
        setLoading(true);
        const walletInfo = await getWalletInfoRequest(authToken);
        if (!active) return;

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
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Failed to load wallet activity.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWalletInfo();
    return () => {
      active = false;
    };
  }, [isAuthReady, user?.token]);

  useEffect(() => {
    if (!chargeStatus) return;
    if (chargeStatus === "success") {
      toast.success("Wallet charge completed successfully.");
    } else if (chargeStatus === "failed") {
      toast.error("Wallet charge did not complete successfully.");
    }
  }, [chargeStatus]);

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
      const response = await chargeWalletRequest(user.token, amount);
      const checkoutUrl = response.checkoutUrl ?? response.paymentUrl;

      if (!checkoutUrl) {
        throw new Error("Backend did not return a checkout URL.");
      }

      await openExternalUrl(checkoutUrl);
    } catch (error) {
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

  return (
    <div className="ndeef-page-shell min-h-screen bg-[#f8fafc]" dir="ltr">
      <div className="ndeef-page-header border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500">Charge wallet, review balance, and track refunds from backend.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {chargeStatus === "success" ? (
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Wallet charge completed</p>
                <p className="mt-1 text-sm text-emerald-800/90">
                  Your balance and wallet activity below are now read from backend wallet info.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {chargeStatus === "failed" ? (
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-rose-100 p-2 text-rose-700">
                <XCircle size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-900">Wallet charge failed</p>
                <p className="mt-1 text-sm text-rose-800/90">
                  The payment gateway returned a failed status. You can retry the charge below.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1D6076] via-[#246b83] to-[#0d3d50] p-6 text-white shadow-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">Wallet funding</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                  Start a real wallet charge from backend. Returned funds and successful charges will appear here automatically.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <WalletIcon size={24} strokeWidth={2} />
              </div>
            </div>

            <div className="mt-8 rounded-[26px] bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    Charge amount
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={chargeAmount}
                    onChange={(event) => setChargeAmount(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/15 bg-white px-4 text-base font-semibold text-slate-900 outline-none focus:border-white/40"
                  />
                </label>
                <button
                  onClick={() => void handleChargeWallet()}
                  disabled={charging}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EBA050] px-5 text-sm font-semibold text-slate-950 transition hover:bg-[#e29a49] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {charging ? <Loader2 size={16} className="animate-spin" strokeWidth={2.4} /> : <Plus size={16} strokeWidth={2.4} />}
                  {charging ? "Starting..." : "Charge wallet"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setChargeAmount(String(amount))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      Number(chargeAmount) === amount
                        ? "bg-white text-[#1D6076]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {amount} EGP
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#dce9ee] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#1D6076]/10 p-3 text-[#1D6076]">
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Backend wallet sync</p>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  This page now reads live wallet details from <code className="rounded bg-slate-100 px-1 py-0.5">GET /api/wallet/info</code>.
                </p>
              </div>
            </div>

            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${walletActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              {walletActive ? "Wallet is active on backend." : "Wallet is inactive on backend."}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <WalletIcon size={20} strokeWidth={2} />
            </div>
            <p className="text-sm text-gray-500">Current wallet balance</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(walletBalance)}</p>
            <p className="mt-1 text-sm text-gray-500">Real available balance from backend.</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Plus size={20} strokeWidth={2} />
            </div>
            <p className="text-sm text-gray-500">Total wallet charges</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(totalCharged)}</p>
            <p className="mt-1 text-sm text-gray-500">Lifetime amount charged into wallet.</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="text-sm text-gray-500">Refunds returned</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(refundsTotal)}</p>
            <p className="mt-1 text-sm text-gray-500">Refund credits returned to wallet on cancelled orders.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Wallet activity</h2>
              <p className="text-sm text-gray-500">Live records from <code className="rounded bg-slate-100 px-1 py-0.5">GET /api/wallet/info</code>.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                <Filter size={14} />
                Filter
              </span>
              {([
                ["all", "All"],
                ["wallet", "Wallet"],
                ["mobile", "Mobile"],
                ["cash", "Cash"],
                ["refund", "Refunds"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    filter === value
                      ? "bg-[#1D6076] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No wallet activity was returned for this filter yet.
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{transaction.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getMethodChipClass(transaction.paymentMethod)}`}>
                        {transaction.paymentMethod}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusChipClass(transaction.paymentStatus)}`}>
                        {transaction.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{transaction.time}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${transaction.positive ? "text-emerald-600" : "text-gray-900"}`}>
                      {transaction.amountLabel}
                    </span>
                    {transaction.paymentStatus.toLowerCase() === "failed" ? (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    ) : transaction.paymentStatus.toLowerCase() === "completed" || transaction.paymentStatus.toLowerCase() === "paid" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
