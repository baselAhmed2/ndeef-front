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
  paymentReference: string | null;
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
  merchantOrderId: string | null;
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

function normalizeMerchantOrderId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasMatchingWalletCharge(
  items: WalletTransaction[],
  pendingCharge: PendingWalletCharge | null,
) {
  if (!pendingCharge) return false;

  if (pendingCharge.merchantOrderId) {
    return items.some((item) => item.paymentReference === pendingCharge.merchantOrderId);
  }

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

function InteractiveVisaCard({
  balance,
  cardholderName,
  phone,
  isActive
}: {
  balance: number;
  cardholderName: string;
  phone: string;
  isActive: boolean;
}) {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 7 degrees tilt for optimal readability and natural metallic response
    const rotateX = ((centerY - y) / centerY) * 7;
    const rotateY = ((x - centerX) / centerX) * -7;

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

  // Dynamic card number using phone digits if available
  const lastFour = phone ? phone.trim().slice(-4) : "2026";
  const cardNumber = `4310 9982 5712 ${lastFour}`;

  return (
    <div
      className="relative w-full max-w-[400px] aspect-[1.586/1] rounded-[24px] overflow-hidden select-none cursor-pointer group shadow-[0_15px_35px_-5px_rgba(29,96,118,0.3)] hover:shadow-[0_25px_50px_-5px_rgba(29,96,118,0.45)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_25px_50px_rgba(45,160,180,0.2)] transition-shadow duration-300"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
    >
      {/* Visa Card Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out group-hover:scale-[1.04]"
        style={{ backgroundImage: "url('/visa-card.png')" }}
      />
      
      {/* Subtle Metallic Reflex Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Dynamic 3D lighting sheen */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] cubic-bezier(0.25, 1, 0.5, 1) pointer-events-none" />

      {/* Card Content Overlay */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between text-white pointer-events-none">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] font-bold text-white/80 uppercase font-sans">
              Nazeef Platinum
            </span>
            <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold tracking-wider uppercase ${
              isActive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}>
              <span className={`h-1 w-1 rounded-full ${isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {/* Note: Visa logo & Contactless are present in the background design */}
        </div>

        {/* Center: Available Balance (Styled beautifully & creatively) */}
        <div className="flex flex-col mt-3">
          <span className="text-[8px] sm:text-[9px] tracking-[0.2em] font-medium text-white/60 uppercase">
            Available Balance
          </span>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            <span className="text-[10px] sm:text-xs font-medium text-white/80">EGP</span>
          </span>
        </div>

        {/* Bottom Section: Cardholder and Number */}
        <div className="flex items-end justify-between mt-auto">
          {/* Holder Name */}
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[7px] sm:text-[8px] tracking-[0.15em] text-white/50 uppercase">
              Cardholder
            </span>
            <span className="text-[11px] sm:text-[12px] font-mono font-bold tracking-[0.12em] text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] mt-0.5 uppercase">
              {cardholderName || "Nazeef Customer"}
            </span>
          </div>

          {/* Masked Card Number */}
          <div className="flex flex-col items-end text-right shrink-0">
            <span className="text-[7px] sm:text-[8px] tracking-[0.15em] text-white/50 uppercase font-sans">
              Card Number
            </span>
            <span className="text-[10px] sm:text-[12px] font-mono font-bold tracking-wider text-white/90 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
              {cardNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
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
  const callbackMerchantOrderId = searchParams?.get("merchantOrderId");
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
        paymentReference: item.paymentReference ?? null,
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
    const activePendingCharge = (() => {
      const stored = readPendingWalletCharge();
      const queryMerchantOrderId = normalizeMerchantOrderId(callbackMerchantOrderId);

      if (!queryMerchantOrderId) {
        return stored;
      }

      if (stored?.merchantOrderId === queryMerchantOrderId) {
        return stored;
      }

      return {
        amount: stored?.amount ?? 0,
        startedAt: stored?.startedAt ?? new Date().toISOString(),
        merchantOrderId: queryMerchantOrderId,
      };
    })();

    setPendingCharge(activePendingCharge);
    if (activePendingCharge) {
      writePendingWalletCharge(activePendingCharge);
    }
    setSyncState("waiting");

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const mapped = await loadWalletInfo(user.token as string);
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
  }, [callbackMerchantOrderId, chargeStatus, loadWalletInfo, user?.token]);

  useEffect(() => {
    if (!chargeStatus) return;
    if (chargeStatus === "success") {
      toast.success("Wallet charge completed successfully.");
    } else if (chargeStatus === "failed") {
      toast.error("Wallet charge did not complete successfully.");
    }

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("status");
    params.delete("merchantOrderId");
    const nextQuery = params.toString();
    const timeout = window.setTimeout(() => {
      const safePath = pathname ?? "/wallet";
      router.replace(nextQuery ? `${safePath}?${nextQuery}` : safePath, { scroll: false });
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
      const response = await chargeWalletRequest(user.token, amount);
      const checkoutUrl = response.checkoutUrl ?? response.paymentUrl;
      const merchantOrderId = normalizeMerchantOrderId(response.orderId);

      if (!checkoutUrl) {
        throw new Error("Unable to start checkout right now.");
      }

      const nextPendingCharge = {
        amount,
        startedAt: new Date().toISOString(),
        merchantOrderId,
      };

      writePendingWalletCharge(nextPendingCharge);
      setPendingCharge(nextPendingCharge);
      setSyncState("waiting");

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
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] dark:bg-[#0b131a] flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-[#1D6076] dark:text-[#7aafd2]" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (isAuthReady && !user?.token) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] dark:bg-[#0b131a] flex items-center justify-center px-6 transition-colors duration-300">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Please log in to access your wallet.</p>
          <Link
            href="/login?from=/wallet"
            className="mt-4 inline-flex rounded-xl bg-[#1D6076] dark:bg-[#EBA050] px-4 py-3 text-white dark:text-slate-950 font-medium hover:opacity-90 transition-opacity"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isAuthReady && user?.token && !isCustomerRole) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] dark:bg-[#0b131a] px-6 py-12 transition-colors duration-300">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-[#111e29] p-8 shadow-sm transition-all">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <WalletIcon size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet charge returned to a non-customer session</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
            This browser is currently signed in as <span className="font-semibold text-gray-900 dark:text-white">{user.role}</span>, so the customer wallet page cannot open here.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
            If the charge was started from a customer account on another session or device, sign in here with that same customer account to see the updated wallet balance.
          </p>
          {chargeStatus ? (
            <div className="mt-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#182835] px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
              Payment gateway returned status: <span className="font-semibold dark:text-white">{chargeStatus}</span>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?role=Customer&from=/wallet"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1D6076] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164d5f] dark:bg-[#EBA050] dark:text-slate-950 dark:hover:bg-[#d4832a]"
            >
              Sign in as Customer
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#182835] px-5 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-white/8"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] dark:bg-[#0b131a] transition-colors duration-300" dir="ltr">
      <div className="ndeef-page-header border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-[#111e29]/95 backdrop-blur-sm transition-colors">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 dark:text-slate-300 transition hover:bg-gray-100 dark:hover:bg-white/8"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Charge wallet, review balance, and track refunds from backend.</p>
          </div>
          <button
            type="button"
            onClick={() => void (user?.token ? loadWalletInfo(user.token) : Promise.resolve())}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111e29] px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 transition hover:bg-gray-50 dark:hover:bg-white/8"
          >
            <RefreshCw size={15} strokeWidth={2} className="dark:text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {chargeStatus === "success" ? (
          <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/5 dark:to-transparent px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 p-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Wallet charge completed</p>
                <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-400/80">
                  Your balance and wallet activity below are now read from backend wallet info.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {syncState === "waiting" ? (
          <div className="rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/5 dark:to-transparent px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/20 p-2 text-amber-700 dark:text-amber-400">
                <Loader2 size={18} className="animate-spin" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Waiting for backend confirmation</p>
                <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-400/80">
                  {pendingCharge
                    ? `We are waiting for Kashier webhook confirmation for ${formatMoney(pendingCharge.amount)}. Your wallet balance will update automatically once backend records the charge.`
                    : "Payment checkout finished. Your wallet balance will update automatically once backend confirms the charge."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {syncState === "confirmed" ? (
          <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/5 dark:to-transparent px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 p-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Wallet balance updated</p>
                <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-400/80">
                  Backend confirmed the wallet charge and the updated balance is shown below.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {chargeStatus === "failed" ? (
          <div className="rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-gradient-to-r from-rose-50 to-white dark:from-rose-500/5 dark:to-transparent px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-rose-100 dark:bg-rose-500/20 p-2 text-rose-700 dark:text-rose-400">
                <XCircle size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">Wallet charge failed</p>
                <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-400/80">
                  The payment gateway returned a failed status. You can retry the charge below.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {syncState === "timeout" ? (
          <div className="rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-gradient-to-r from-rose-50 to-white dark:from-rose-500/5 dark:to-transparent px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-rose-100 dark:bg-rose-500/20 p-2 text-rose-700 dark:text-rose-400">
                <Clock3 size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">Backend confirmation is taking longer than expected</p>
                <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-400/80">
                  The checkout may have succeeded, but the wallet charge has not appeared in backend records yet. Try Refresh once, and if the balance still does not change, the backend webhook still needs checking.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Dynamic Split Hero Section */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          {/* Card Showcase Column */}
          <div className="flex flex-col justify-between gap-5 bg-white dark:bg-[#111e29] border border-gray-200/80 dark:border-white/5 p-6 rounded-[30px] shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">My Nazeef Visa Card</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Hover or move cursor over the card for a dynamic 3D response.</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                walletActive 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${walletActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {walletActive ? "Active Card" : "Inactive"}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center py-4">
              <InteractiveVisaCard 
                balance={walletBalance}
                cardholderName={user?.name || ""}
                phone={user?.phone || ""}
                isActive={walletActive}
              />
            </div>

            <div className="border-t border-gray-100 dark:border-white/5 pt-4 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#1D6076] dark:text-[#7aafd2]" />
                Secure Chip Enabled
              </span>
              <span>100% Secure Web Callback</span>
            </div>
          </div>

          {/* Quick Charge Control panel */}
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1D6076] via-[#246b83] to-[#0d3d50] dark:from-[#112d38] dark:via-[#193a47] dark:to-[#09222c] p-6 text-white shadow-xl sm:p-8 flex flex-col justify-between transition-colors duration-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">Wallet Funding</p>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Top up your account balance instantly using Kashier payment gateway checkout.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <WalletIcon size={24} strokeWidth={2} />
              </div>
            </div>

            <div className="mt-8 rounded-[26px] bg-white/10 dark:bg-white/5 p-4 backdrop-blur-sm">
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
                    className="h-12 w-full rounded-2xl border border-white/15 bg-white dark:bg-[#182835] px-4 text-base font-semibold text-slate-900 dark:text-white outline-none focus:border-white/40 dark:focus:border-white/20 transition-all"
                  />
                </label>
                <button
                  onClick={() => void handleChargeWallet()}
                  disabled={charging}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EBA050] hover:bg-[#e29a49] dark:bg-[#EBA050] dark:text-slate-950 dark:hover:bg-[#d4832a] px-5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
                >
                  {charging ? <Loader2 size={16} className="animate-spin" strokeWidth={2.4} /> : <Plus size={16} strokeWidth={2.4} />}
                  {charging ? "Starting..." : "Charge wallet"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setChargeAmount(String(amount))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      Number(chargeAmount) === amount
                        ? "bg-white text-[#1D6076] dark:text-[#112d38] shadow-sm"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {amount} EGP
                  </button>
                ))}
              </div>
>>>>>>> b5263f2943b2d494a31d8faed3f2d0b550c358c4
            </div>
          </div>
        </div>

        {/* Dashboard stats grids */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111e29] p-5 shadow-sm transition-colors duration-300">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <WalletIcon size={20} strokeWidth={2} />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Current wallet balance</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(walletBalance)}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Real available balance from backend.</p>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111e29] p-5 shadow-sm transition-colors duration-300">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Plus size={20} strokeWidth={2} />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Total wallet charges</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(totalCharged)}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Lifetime amount charged into wallet.</p>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111e29] p-5 shadow-sm transition-colors duration-300">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Refunds returned</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(refundsTotal)}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Refund credits returned to wallet on cancelled orders.</p>
          </div>
        </div>

        {/* History Activities */}
        <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111e29] p-5 shadow-sm sm:p-6 transition-colors duration-300">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Wallet activity</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Live records from <code className="rounded bg-slate-100 dark:bg-white/8 px-1 py-0.5 text-xs text-slate-700 dark:text-slate-300">GET /api/wallet/info</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/5 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                      ? "bg-[#1D6076] dark:bg-[#EBA050] text-white dark:text-slate-950"
                      : "border border-slate-200 dark:border-white/5 bg-white dark:bg-[#182835] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/8"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#182835]/40 px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                No wallet activity was returned for this filter yet.
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#182835] px-4 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-100/50 dark:hover:bg-[#172733] transition-colors duration-200"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{transaction.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getMethodChipClass(transaction.paymentMethod)}`}>
                        {transaction.paymentMethod}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusChipClass(transaction.paymentStatus)}`}>
                        {transaction.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{transaction.time}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${transaction.positive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-950 dark:text-slate-200"}`}>
                      {transaction.amountLabel}
                    </span>
                    {transaction.paymentStatus.toLowerCase() === "failed" ? (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    ) : transaction.paymentStatus.toLowerCase() === "completed" || transaction.paymentStatus.toLowerCase() === "paid" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-500 animate-pulse" />
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

