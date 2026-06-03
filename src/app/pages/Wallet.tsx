"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { getWalletInfoRequest } from "../lib/api";

type WalletTransaction = {
  id: number;
  orderId: string | null;
  title: string;
  amount: number;
  amountLabel: string;
  time: string;
  createdAt: string | null;
  paymentReference: string | null;
  positive: boolean;
  paymentMethod: string;
  paymentStatus: string;
  source: string;
};

type ActivityFilter = "all" | "wallet" | "mobile" | "cash" | "refund";

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
    case "Wallet": return "wallet";
    case "MobilePayment": return "mobile";
    case "Cash": return "cash";
    case "Refund": return "refund";
    default: return "all";
  }
}

function inferTransactionTitle(source: string, type: string) {
  const s = String(source || "").toLowerCase();
  const t = String(type || "").toLowerCase();
  if (s.includes("walletcharge")) return "Wallet Charge";
  if (s.includes("walletpayment")) return t === "debit" ? "Auto-deducted from Wallet" : "Wallet Credit";
  if (s.includes("refund")) return "Refund to Wallet";
  if (s.includes("mobilewallet")) return "Mobile Wallet Payment";
  if (s.includes("cashpayment")) return "Cash Payment";
  return "Wallet Activity";
}

function normalizeMerchantOrderId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ========= Interactive Visa Card =========
function InteractiveVisaCard({
  balance,
  cardholderName,
  phone,
}: {
  balance: number;
  cardholderName: string;
  phone: string;
}) {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [balanceVisible, setBalanceVisible] = useState(true);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * -6;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 0.08s cubic-bezier(0.25, 1, 0.5, 1)",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
    });
  };

  const lastFour = phone ? phone.trim().slice(-4) : "2026";
  const cardNumber = `4310 9982 5712 ${lastFour}`;

  return (
    <div
      className="relative w-full max-w-[400px] aspect-[1.586/1] rounded-[24px] overflow-hidden select-none cursor-pointer group shadow-[0_15px_35px_-5px_rgba(29,96,118,0.3)] hover:shadow-[0_25px_50px_-5px_rgba(29,96,118,0.45)] transition-shadow duration-300"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out group-hover:scale-[1.04]"
        style={{ backgroundImage: "url('/visa-card.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] pointer-events-none" />

      <div className="absolute inset-0">
        <div className="absolute left-[8%] bottom-[21%] flex items-end gap-1.5">
          <div className="flex flex-col">
            <span className="text-[6px] sm:text-[7px] tracking-[0.18em] text-white/70 uppercase font-semibold font-sans mb-0.5">
              Available Balance
            </span>
            <span className="text-[13px] sm:text-[15px] font-extrabold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] leading-none">
              {balanceVisible
                ? balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "••••••"}
              {" "}<span className="text-[8px] font-semibold text-white/80">EGP</span>
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setBalanceVisible((v) => !v); }}
            className="mb-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white/80 hover:text-white transition-all duration-200"
            aria-label={balanceVisible ? "Hide balance" : "Show balance"}
          >
            {balanceVisible ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
          </button>
        </div>

        <div className="absolute left-[8%] bottom-[8%] w-[42%] h-[11%] bg-[#165267] flex items-center px-1 rounded-sm pointer-events-none">
          <span className="text-[9px] sm:text-[11px] md:text-[12px] font-mono font-bold tracking-[0.1em] text-white uppercase truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {cardholderName || "NAZEEF CUSTOMER"}
          </span>
        </div>

        <div className="absolute right-[8%] bottom-[8%] w-[38%] h-[11%] bg-gradient-to-r from-[#e0803c] to-[#e8994a] flex items-center justify-end px-1 rounded-sm pointer-events-none">
          <span className="text-[9px] sm:text-[11px] md:text-[12px] font-mono font-bold tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {cardNumber.split(" ").slice(-2).join(" ")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ========= Main Wallet Page =========
export default function Wallet() {
  const { user, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletActive, setWalletActive] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>("all");
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
        orderId: normalizeMerchantOrderId(item.orderId),
        title: inferTransactionTitle(source, type),
        amount: positive ? amount : -amount,
        amountLabel: `${positive ? "+" : "-"}${formatMoney(amount)}`,
        time: formatTransactionDate(item.createdAt),
        createdAt: item.createdAt ?? null,
        paymentReference: item.paymentReference ?? null,
        positive,
        paymentMethod: method,
        paymentStatus: status,
        source,
      };
    });

    setWalletBalance(Number(walletInfo.balance ?? 0));
    setWalletActive(Boolean(walletInfo.isActive ?? true));
    setTransactions(mapped);
    return mapped;
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    const token = user?.token ?? null;
    if (!token) { setLoading(false); return; }

    let active = true;
    async function loadWalletPage() {
      try {
        setLoading(true);
        await loadWalletInfo(token!);
        if (!active) return;
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Failed to load wallet activity.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadWalletPage();
    return () => { active = false; };
  }, [isAuthReady, loadWalletInfo, user?.token]);

  const handleRefreshWallet = async () => {
    if (!user?.token) return;
    try {
      await loadWalletInfo(user.token);
      toast.success("Wallet refreshed.");
    } catch {
      toast.error("Unable to refresh wallet right now.");
    }
  };

  const refundsTotal = useMemo(
    () => transactions
      .filter((t) => t.source.toLowerCase().includes("refund"))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter(
      (t) => getFilterForTransaction(t.paymentMethod, t.source) === filter,
    );
  }, [filter, transactions]);

  // ---- Loading ----
  if (loading) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1D6076]" size={28} strokeWidth={2} />
      </div>
    );
  }

  // ---- Not logged in ----
  if (isAuthReady && !user?.token) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Please log in to access your wallet.</p>
          <Link
            href="/login?from=/wallet"
            className="mt-4 inline-flex rounded-xl bg-[#1D6076] px-4 py-3 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ---- Non-customer ----
  if (isAuthReady && user?.token && !isCustomerRole) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-amber-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <WalletIcon size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet not available for this role</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            This page is for customers only. You are signed in as <span className="font-semibold">{user.role}</span>.
          </p>
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

  // ---- Main page ----
  return (
    <div className="ndeef-page-shell min-h-screen bg-slate-50 transition-colors duration-300" dir="ltr">

      {/* ── Header ── */}
      <div className="ndeef-page-header border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-600 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500">Your balance, refunds & transaction history.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefreshWallet()}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} strokeWidth={2} className="text-gray-400" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">

        {/* ── Hero: Card + Info Panel ── */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">

          {/* Card showcase */}
          <div className="flex flex-col justify-between gap-5 bg-white border border-gray-200 p-6 sm:p-8 rounded-[30px] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">My Nazeef Visa Card</h2>
                <p className="text-xs text-gray-400 mt-0.5">Hover over the card for a 3D effect.</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                walletActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${walletActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                {walletActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center py-4">
              <InteractiveVisaCard
                balance={walletBalance}
                cardholderName={user?.name || ""}
                phone={user?.phone || ""}
              />
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#1D6076]" />
                Secure Chip Enabled
              </span>
              <span>100% Secure Web Callback</span>
            </div>
          </div>

          {/* How it works */}
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1D6076] via-[#246b83] to-[#0d3d50] p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">How Your Wallet Works</p>
                <p className="mt-3 text-sm leading-6 text-white/90">
                  Your wallet balance is deducted automatically on every order. Pay only the difference.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-[26px] bg-white/10 p-5 backdrop-blur-sm">
              {[
                { title: "Auto-deducted on Orders", desc: "Wallet balance is applied automatically — you pay only the remaining amount." },
                { title: "Instant Card Refunds", desc: "If you cancel a card-paid order, your money returns to this wallet instantly." },
                { title: "Always Visible", desc: "Every deduction and refund is recorded here so you always know where your money went." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">{item.title}</h4>
                    <p className="mt-0.5 text-xs text-white/70">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <WalletIcon size={20} strokeWidth={2} />,
              bg: "bg-emerald-50 text-emerald-600",
              label: "Current Balance",
              value: formatMoney(walletBalance),
              sub: "Your spendable wallet balance.",
            },
            {
              icon: <TrendingUp size={20} strokeWidth={2} />,
              bg: "bg-sky-50 text-sky-600",
              label: "Wallet Savings",
              value: formatMoney(
                transactions
                  .filter((t) => t.source.toLowerCase().includes("walletpayment") && !t.positive)
                  .reduce((s, t) => s + Math.abs(t.amount), 0)
              ),
              sub: "Total deducted automatically from wallet.",
            },
            {
              icon: <Clock3 size={20} strokeWidth={2} />,
              bg: "bg-violet-50 text-violet-600",
              label: "Refunds Received",
              value: formatMoney(refundsTotal),
              sub: "Returned from cancelled orders.",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${stat.bg}`}>
                {stat.icon}
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Transaction History ── */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Wallet activity</h2>
              <p className="text-sm text-gray-500">Your latest wallet activity and payment updates.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500">
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
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                No wallet activity for this filter yet.
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-100/70 transition-colors duration-200"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{tx.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        tx.paymentMethod === "Refund" ? "bg-violet-100 text-violet-700" :
                        tx.paymentMethod === "Wallet" ? "bg-emerald-100 text-emerald-700" :
                        tx.paymentMethod === "Cash" ? "bg-amber-100 text-amber-700" :
                        "bg-sky-100 text-sky-700"
                      }`}>
                        {tx.paymentMethod}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        tx.paymentStatus.toLowerCase() === "completed" || tx.paymentStatus.toLowerCase() === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : tx.paymentStatus.toLowerCase() === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {tx.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{tx.time}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${tx.positive ? "text-emerald-600" : "text-gray-800"}`}>
                      {tx.amountLabel}
                    </span>
                    {tx.paymentStatus.toLowerCase() === "failed" ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : tx.paymentStatus.toLowerCase() === "completed" || tx.paymentStatus.toLowerCase() === "paid" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-400 animate-pulse" />
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
