"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Loader2, Plus, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { chargeWalletRequest, getPaymentHistoryRequest } from "../lib/api";

type WalletTransaction = {
  id: number;
  title: string;
  amount: number;
  amountLabel: string;
  time: string;
  positive: boolean;
};

function formatMoney(amount: number) {
  return `${amount.toFixed(2)} EGP`;
}

function formatTransactionDate(value: string | null) {
  if (!value) {
    return "Pending payment";
  }

  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapPaymentMethodLabel(method: string) {
  switch (method) {
    case "Cash":
      return "Cash payment";
    case "Wallet":
      return "Wallet charge";
    case "MobilePayment":
      return "Mobile wallet payment";
    case "CreditCard":
      return "Card payment";
    default:
      return method || "Payment";
  }
}

export default function Wallet() {
  const { user, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    const token = user?.token ?? null;
    if (!token) {
      setLoading(false);
      return;
    }
    const authToken: string = token;

    let active = true;

    async function loadHistory() {
      try {
        setLoading(true);
        const history = await getPaymentHistoryRequest(authToken);
        if (!active) return;

        const mapped = history
          .slice()
          .sort((a, b) => {
            const aTime = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const bTime = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
            return bTime - aTime;
          })
          .map((item) => {
            const positive = item.paymentMethod === "Wallet";
            const signedAmount = positive ? Number(item.amount) : -Number(item.amount);

            return {
              id: item.id,
              title: mapPaymentMethodLabel(item.paymentMethod),
              amount: signedAmount,
              amountLabel: `${positive ? "+" : "-"}${formatMoney(Number(item.amount))}`,
              time: formatTransactionDate(item.paymentDate),
              positive,
            };
          });

        setTransactions(mapped);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Failed to load wallet activity.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [isAuthReady, user]);

  const balance = useMemo(
    () => transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions],
  );

  const pendingAmount = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.positive)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions],
  );

  const handleChargeWallet = async () => {
    if (!user?.token || charging) {
      return;
    }

    const rawAmount = window.prompt("Enter amount to add to your wallet (10 - 10000 EGP).");
    if (!rawAmount) {
      return;
    }

    const amount = Number(rawAmount);
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

      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start wallet charge.");
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1D6076]" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (isAuthReady && !user?.token) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6">
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
    <div className="min-h-screen bg-[#f8fafc]" dir="ltr">
      <div className="sticky top-[72px] z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500">Track balance, credits, and recent activity.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D6076] via-[#246b83] to-[#0d3d50] p-6 text-white shadow-xl sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Available Balance</p>
              <p className="mt-3 text-4xl font-black tracking-tight">{formatMoney(balance)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <WalletIcon size={24} strokeWidth={2} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void handleChargeWallet()}
              disabled={charging}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1D6076] transition hover:bg-gray-100 disabled:opacity-60"
            >
              {charging ? <Loader2 size={16} className="animate-spin" strokeWidth={2.4} /> : <Plus size={16} strokeWidth={2.4} />}
              {charging ? "Starting..." : "Add Funds"}
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white/80"
            >
              Withdraw Balance
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1D6076]/10 text-[#1D6076]">
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-gray-900">Recent transactions</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {transactions.length > 0 ? `${transactions.length} payment records loaded from backend.` : "No wallet activity yet."}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-gray-900">Protected credits</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Wallet top-ups and successful payments are synced from your backend account.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total wallet charges</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(pendingAmount)}</p>
            <p className="mt-1 text-sm text-gray-500">Calculated from payment history returned by the backend.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent activity</h2>
              <p className="text-sm text-gray-500">Your latest wallet transactions.</p>
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No wallet activity was returned from the backend yet.
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{transaction.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{transaction.time}</p>
                  </div>
                  <span className={`text-sm font-bold ${transaction.positive ? "text-emerald-600" : "text-gray-900"}`}>
                    {transaction.amountLabel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
