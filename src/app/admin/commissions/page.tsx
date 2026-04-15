"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import {
  apiRequest,
  ApiError,
  getAllLaundryCommissions,
  sendPaymentReminder,
} from "@/app/lib/admin-api";
import type {
  LaundryDebtRecord,
  SystemCommissionsRecord,
} from "@/app/types/admin";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CommissionsPage() {
  const [data, setData] = useState<SystemCommissionsRecord | null>(null);
  const [laundryCommissions, setLaundryCommissions] = useState<Array<{
    laundryId: string;
    laundryName: string;
    ownerName: string;
    totalRevenue: number;
    commissionRate: number;
    commissionDue: number;
    commissionPaid: number;
    lastPaymentDate: string | null;
    paymentStatus: "paid" | "pending" | "overdue";
    paymentHistory: Array<{
      id: string;
      amount: number;
      date: string;
      method: "kashier" | "cash" | "bank_transfer";
      status: "completed" | "pending" | "failed";
    }>;
  }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "laundries" | "transactions">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    void fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const [overview, laundries] = await Promise.all([
        apiRequest<SystemCommissionsRecord>("/admin/commissions"),
        getAllLaundryCommissions().catch(() => null), // Gracefully handle if endpoint doesn't exist yet
      ]);
      setData(overview);
      if (laundries) setLaundryCommissions(laundries);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to load commissions overview.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <LoaderCircle size={32} className="animate-spin text-[#2A5C66]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 font-medium text-red-600">
          <AlertTriangle />
          {error || "No commissions data returned from the backend."}
        </div>
        <button
          onClick={() => void fetchCommissions()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const filteredDebts = data.laundryDebts.filter((debt) =>
    debt.laundryName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter laundries by search query
  const filteredLaundries = laundryCommissions?.filter((laundry) =>
    laundry.laundryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    laundry.ownerName.toLowerCase().includes(searchQuery.toLowerCase()),
  ) ?? [];

  // Calculate payment statistics
  const paymentStats = {
    total: laundryCommissions?.length ?? 0,
    paid: laundryCommissions?.filter((l) => l.paymentStatus === "paid").length ?? 0,
    pending: laundryCommissions?.filter((l) => l.paymentStatus === "pending").length ?? 0,
    overdue: laundryCommissions?.filter((l) => l.paymentStatus === "overdue").length ?? 0,
  };

  // Handle sending payment reminder
  const handleSendReminder = async (laundryId: string) => {
    try {
      setSendingReminder(laundryId);
      await sendPaymentReminder(laundryId);
      alert("Payment reminder sent successfully!");
    } catch (error) {
      alert("Failed to send reminder. Please try again.");
    } finally {
      setSendingReminder(null);
    }
  };

  const highestDebt = data.laundryDebts.reduce<LaundryDebtRecord | null>(
    (current, debt) => (!current || debt.pendingCommission > current.pendingCommission ? debt : current),
    null,
  );

  const averageCommissionRate =
    data.recentTransactions.length > 0
      ? data.recentTransactions.reduce(
          (sum, transaction) => sum + Number(transaction.commissionPercentage || 0),
          0,
        ) / data.recentTransactions.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Wallet size={32} className="text-[#2A5C66]" />
            Commissions & Debts
          </h1>
          <p className="text-slate-500 mt-2">
            Connected to <code className="rounded bg-slate-100 px-1">GET /api/admin/commissions</code>.
          </p>
        </div>
        <button
          onClick={() => void fetchCommissions()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-70"
        >
          {isRefreshing ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 font-medium text-red-600">
          <AlertTriangle />
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#2A5C66] to-[#1d4047] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 opacity-10 scale-150 transform translate-x-10 -translate-y-10">
            <Wallet size={160} />
          </div>
          <p className="text-white/80 font-medium mb-1">Total Platform Commissions</p>
          <h2 className="text-4xl font-black">{formatCurrency(data.totalPlatformCommissions)}</h2>
          <div className="mt-6 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm">
            <ArrowUpRight size={16} /> Lifetime Earnings
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 text-slate-800 relative overflow-hidden border border-slate-100 shadow-sm">
          <div className="absolute right-0 top-0 opacity-5 scale-150 transform translate-x-10 -translate-y-10">
            <ArrowDownRight size={160} className="text-orange-500" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Total Pending Debts</p>
          <h2 className="text-4xl font-black text-orange-500">{formatCurrency(data.totalPendingDebts)}</h2>
          <div className="mt-6 flex items-center gap-2 bg-orange-50 text-orange-600 w-fit px-3 py-1 rounded-full text-sm">
            <Activity size={16} /> Uncollected Cash
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tracked Laundries</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.laundryDebts.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Avg Commission Rate</p>
          <p className="mt-2 text-3xl font-bold text-[#2A5C66]">{averageCommissionRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Highest Debt</p>
          <p className="mt-2 text-lg font-bold text-red-600">
            {highestDebt ? highestDebt.laundryName : "No debts"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {highestDebt ? formatCurrency(highestDebt.pendingCommission) : "Nothing pending"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button 
              className={`flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'laundries' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              onClick={() => setActiveTab('laundries')}
            >
              All Laundries
            </button>
            <button 
              className={`flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'transactions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              onClick={() => setActiveTab('transactions')}
            >
              Recent Transactions
            </button>
          </div>

          {(activeTab === 'overview' || activeTab === 'laundries') && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search laundries..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#2A5C66]/20 transition-all text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="p-0">
          {activeTab === 'overview' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Laundry Name</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Total Earnings</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Pending Debt</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Debt Ceiling</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDebts.length > 0 ? filteredDebts.map((debt, idx) => {
                    const debtPercentage =
                      debt.debtCeiling > 0 ? (debt.pendingCommission / debt.debtCeiling) * 100 : 0;
                    const isDanger = debtPercentage > 80;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-800">{debt.laundryName}</td>
                        <td className="py-4 px-6 text-slate-600">{formatCurrency(debt.totalEarnings)}</td>
                        <td className="py-4 px-6">
                          <span className={`font-bold ${isDanger ? 'text-red-600' : 'text-slate-800'}`}>
                            {formatCurrency(debt.pendingCommission)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500">{formatCurrency(debt.debtCeiling)}</td>
                        <td className="py-4 px-6">
                          <span className={clsx(
                            "px-2 py-1 rounded-md text-xs font-bold",
                            debt.status === 'Active'
                              ? 'bg-green-50 text-green-600'
                              : debt.status === 'Suspended'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600',
                          )}>
                            {debt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No debts found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Transaction ID</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Laundry</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Order Amount</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Collected Commission</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentTransactions.length > 0 ? data.recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-600 text-sm">#TX-{tx.id}</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{tx.laundryName}</td>
                      <td className="py-4 px-6 text-slate-500">
                        <div>{formatCurrency(tx.orderAmount)}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Order #{tx.orderId || "-"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-green-600">+ {formatCurrency(tx.commissionAmount)}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {Number(tx.commissionPercentage).toFixed(1)}% rate
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-sm">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'laundries' ? (
            <div className="p-6">
              {/* Payment Status Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-slate-800">{paymentStats.total}</div>
                  <div className="text-sm text-slate-500">Total Laundries</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-600">{paymentStats.paid}</div>
                  <div className="text-sm text-green-600">Paid</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-amber-600">{paymentStats.pending}</div>
                  <div className="text-sm text-amber-600">Pending</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-600">{paymentStats.overdue}</div>
                  <div className="text-sm text-red-600">Overdue</div>
                </div>
              </div>

              {/* Laundries Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Laundry</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Owner</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Revenue</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Commission Due</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Paid</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Status</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Last Payment</th>
                      <th className="font-semibold text-slate-500 text-sm py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLaundries.length > 0 ? filteredLaundries.map((laundry) => (
                      <tr key={laundry.laundryId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-800">{laundry.laundryName}</td>
                        <td className="py-4 px-6 text-slate-500">{laundry.ownerName}</td>
                        <td className="py-4 px-6 text-slate-600">{formatCurrency(laundry.totalRevenue)}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800">{formatCurrency(laundry.commissionDue)}</td>
                        <td className="py-4 px-6 text-green-600">{formatCurrency(laundry.commissionPaid)}</td>
                        <td className="py-4 px-6">
                          <span className={clsx(
                            "px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-fit",
                            laundry.paymentStatus === 'paid'
                              ? 'bg-green-50 text-green-600'
                              : laundry.paymentStatus === 'overdue'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600'
                          )}>
                            {laundry.paymentStatus === 'paid' && <CheckCircle2 size={12} />}
                            {laundry.paymentStatus === 'pending' && <Clock size={12} />}
                            {laundry.paymentStatus === 'overdue' && <XCircle size={12} />}
                            {laundry.paymentStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-sm">
                          {laundry.lastPaymentDate ? formatDateTime(laundry.lastPaymentDate) : "Never"}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleSendReminder(laundry.laundryId)}
                            disabled={sendingReminder === laundry.laundryId}
                            className="p-2 text-slate-400 hover:text-[#2A5C66] hover:bg-[#2A5C66]/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Send payment reminder"
                          >
                            {sendingReminder === laundry.laundryId ? (
                              <LoaderCircle size={18} className="animate-spin" />
                            ) : (
                              <Mail size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          {laundryCommissions === null ? "Loading..." : "No laundries found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Transaction ID</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Laundry</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Order Amount</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Collected Commission</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentTransactions.length > 0 ? data.recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-600 text-sm">#TX-{tx.id}</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{tx.laundryName}</td>
                      <td className="py-4 px-6 text-slate-500">
                        <div>{formatCurrency(tx.orderAmount)}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Order #{tx.orderId || "-"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-green-600">+ {formatCurrency(tx.commissionAmount)}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {Number(tx.commissionPercentage).toFixed(1)}% rate
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-sm">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
