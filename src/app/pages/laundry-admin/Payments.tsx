"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  getCommissionSummary,
  getPayments,
  getRevenueWeekly,
  initiateKashier,
} from "@/app/lib/laundry-admin-client";
import { AnimatePresence, motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Info,
  Lock,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

type PaymentStatus = "All" | "Paid" | "Pending" | "Refunded";

interface Payment {
  id: string;
  orderId: string;
  customer: string;
  method: string;
  amount: number;
  status: Exclude<PaymentStatus, "All">;
  date: string;
  service: string;
}

interface CommissionInfo {
  totalRevenue?: number;
  commissionDue?: number;
  rate?: number;
  commissionPaid?: number;
  status?: string;
}

const statusConfig: Record<
  Exclude<PaymentStatus, "All">,
  { color: string; bg: string; icon: ElementType }
> = {
  Paid: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  Pending: { color: "#1D5B70", bg: "#e8f4f8", icon: Clock },
  Refunded: { color: "#ef4444", bg: "#fef2f2", icon: XCircle },
};

const DEFAULT_COMMISSION_RATE_PERCENT = 10;
const tabs: PaymentStatus[] = ["All", "Paid", "Pending", "Refunded"];
const ITEMS_PER_PAGE = 8;

function VisaBadge() {
  return (
    <div className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm">
      <svg viewBox="0 0 50 16" className="h-3.5 w-auto" fill="none">
        <text
          x="0"
          y="13"
          fontFamily="Arial, sans-serif"
          fontSize="14"
          fontWeight="900"
          fill="#1A1F71"
          letterSpacing="-0.5"
        >
          VISA
        </text>
      </svg>
    </div>
  );
}

function WalletBadge() {
  return (
    <div className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 shadow-sm">
      <Wallet className="h-3.5 w-3.5 text-gray-500" />
      <span className="text-[11px] font-semibold text-gray-600">Wallet</span>
    </div>
  );
}

function InstaPayBadge() {
  return (
    <div className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 shadow-sm">
      <Smartphone className="h-3.5 w-3.5" style={{ color: "#1D5B70" }} />
      <span className="text-[11px] font-semibold" style={{ color: "#1D5B70" }}>
        InstaPay
      </span>
    </div>
  );
}

function MoreBadge() {
  return (
    <div className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 shadow-sm">
      <CreditCard className="h-3 w-3 text-gray-400" />
      <span className="text-[11px] font-semibold text-gray-400">+more</span>
    </div>
  );
}

function downloadPaymentsCsv(rows: Payment[]) {
  const csvRows = [
    ["Payment ID", "Order ID", "Customer", "Service", "Method", "Date", "Amount", "Status"],
    ...rows.map((row) => [
      row.id,
      row.orderId,
      row.customer,
      row.service,
      row.method,
      row.date,
      row.amount.toFixed(2),
      row.status,
    ]),
  ];

  const csvContent = csvRows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `laundry-payments-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function PlatformCommissionCard({
  totalRevenue,
  commissionDue,
  commissionRatePercent,
  status,
}: {
  totalRevenue: number;
  commissionDue: number;
  commissionRatePercent: number;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const isSettled = commissionDue <= 0 || status.toLowerCase() === "paid";

  const handlePayWithKashier = async () => {
    if (isSettled || loading) return;

    setLoading(true);
    setPaymentError("");

    try {
      const result = await initiateKashier(commissionDue);
      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      setPaymentError("Secure checkout could not be started right now.");
    } catch (error) {
      console.error("Failed to start Kashier checkout", error);
      setPaymentError(
        error instanceof Error ? error.message : "Secure checkout could not be started right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-[#1D5B70]/20 bg-white"
    >
      <div className="flex flex-col lg:flex-row">
        <div
          className="flex flex-1 flex-col justify-between gap-5 p-6"
          style={{ background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" }}
        >
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-white/90">Platform Commission</p>
            </div>

            <p className="mb-1 text-xs text-white/60">Amount due this cycle</p>
            <p className="text-4xl font-bold tracking-tight text-white">
              EGP {commissionDue.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {commissionRatePercent.toFixed(0)}% of EGP{" "}
              {totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })} total revenue
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/50" />
            <p className="text-xs leading-relaxed text-white/50">
              Pay your commission to keep your account active and accepting orders on the Ndeef
              platform.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 bg-white p-6 lg:w-80">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Pay securely via
              </p>
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ backgroundColor: "#1D5B7010" }}
              >
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: "#1D5B70" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#1D5B70" }}>
                  SSL Secured
                </span>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
                <span className="text-lg font-black" style={{ color: "#1D5B70" }}>
                  K
                </span>
              </div>
              <div>
                <p className="font-bold tracking-tight text-gray-900">Kashier</p>
                <p className="text-[11px] text-gray-400">Online Payment Gateway</p>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Accepted payment methods
              </p>
              <div className="flex flex-wrap gap-2">
                <VisaBadge />
                <WalletBadge />
                <InstaPayBadge />
                <MoreBadge />
              </div>
            </div>

            <div className="flex items-center justify-between border-y border-gray-100 py-3">
              <span className="text-sm text-gray-500">
                Commission ({commissionRatePercent.toFixed(0)}%)
              </span>
              <span className="font-bold text-gray-900">
                EGP {commissionDue.toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="wait">
              {isSettled ? (
                <motion.div
                  key="settled"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">No Commission Due</span>
                </motion.div>
              ) : (
                <motion.button
                  key="pay"
                  onClick={handlePayWithKashier}
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-80"
                  style={{ background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" }}
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="white"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                        />
                      </svg>
                      Redirecting to Kashier...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay EGP {commissionDue.toLocaleString("en", { minimumFractionDigits: 2 })}{" "}
                      with Kashier
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {paymentError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {paymentError}
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3 text-gray-300" />
              <p className="text-center text-[11px] text-gray-400">
                You'll be redirected to Kashier&apos;s secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Payments() {
  const [activeTab, setActiveTab] = useState<PaymentStatus>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [downloadToast, setDownloadToast] = useState(false);
  const [pageError, setPageError] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenueWeekly, setRevenueWeekly] = useState<Array<{ day: string; revenue: number }>>([]);
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError("");

      const [paymentsResult, commissionResult, revenueResult] = await Promise.allSettled([
        getPayments(),
        getCommissionSummary(),
        getRevenueWeekly(),
      ]);

      if (paymentsResult.status === "fulfilled") {
        setPayments(paymentsResult.value);
      } else {
        console.error("Failed to load payments", paymentsResult.reason);
      }

      if (commissionResult.status === "fulfilled") {
        setCommissionInfo(commissionResult.value);
      } else {
        console.error("Failed to load commission summary", commissionResult.reason);
      }

      if (revenueResult.status === "fulfilled") {
        setRevenueWeekly(revenueResult.value);
      } else {
        console.error("Failed to load weekly revenue", revenueResult.reason);
      }

      if (
        paymentsResult.status === "rejected" &&
        commissionResult.status === "rejected" &&
        revenueResult.status === "rejected"
      ) {
        setPageError("Payment data could not be loaded right now.");
      }

      setLoading(false);
    }

    void loadData();
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const matchTab = activeTab === "All" || payment.status === activeTab;
      const term = search.trim().toLowerCase();
      const matchSearch =
        term === "" ||
        payment.id.toLowerCase().includes(term) ||
        payment.customer.toLowerCase().includes(term) ||
        payment.orderId.toLowerCase().includes(term);
      return matchTab && matchSearch;
    });
  }, [activeTab, payments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const totalRevenue =
    commissionInfo?.totalRevenue ??
    payments
      .filter((payment) => payment.status === "Paid")
      .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const commissionRatePercent = commissionInfo?.rate ?? DEFAULT_COMMISSION_RATE_PERCENT;
  const commissionDue =
    commissionInfo?.commissionDue ?? totalRevenue * (commissionRatePercent / 100);

  const handleDownload = () => {
    if (filtered.length === 0) return;
    downloadPaymentsCsv(filtered);
    setDownloadToast(true);
    window.setTimeout(() => setDownloadToast(false), 2500);
  };

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="space-y-5 p-6">
      {pageError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <PlatformCommissionCard
        totalRevenue={totalRevenue}
        commissionDue={commissionDue}
        commissionRatePercent={commissionRatePercent}
        status={commissionInfo?.status ?? ""}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Revenue",
            value: `EGP ${totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}`,
            sub: "All paid payments",
            icon: DollarSign,
            accent: true,
          },
          {
            label: "Pending Payments",
            value: `EGP ${pendingAmount.toFixed(2)}`,
            sub: `${payments.filter((payment) => payment.status === "Pending").length} orders`,
            icon: Clock,
            accent: false,
          },
          {
            label: "Platform Commission Due",
            value: `EGP ${commissionDue.toFixed(2)}`,
            sub: `${commissionRatePercent.toFixed(0)}% of total revenue`,
            icon: ArrowDownLeft,
            accent: false,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className={`rounded-2xl border p-5 ${
              stat.accent ? "border-transparent text-white" : "border-gray-100 bg-white"
            }`}
            style={
              stat.accent ? { background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" } : {}
            }
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: stat.accent ? "rgba(255,255,255,0.2)" : "#1D5B7015" }}
              >
                <stat.icon
                  className="h-5 w-5"
                  style={{ color: stat.accent ? "white" : "#1D5B70" }}
                />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.accent ? "text-white" : "text-gray-900"}`}>
                  {stat.value}
                </p>
                <p className={`text-xs ${stat.accent ? "text-white/70" : "text-gray-400"}`}>
                  {stat.sub}
                </p>
              </div>
            </div>
            <p className={`text-sm font-medium ${stat.accent ? "text-white/90" : "text-gray-700"}`}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl border border-gray-100 bg-white p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Revenue This Week</h3>
            <p className="mt-0.5 text-xs text-gray-400">Daily revenue breakdown</p>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-green-600">Backend Connected</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueWeekly} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{ borderRadius: 10, fontSize: 12 }}
              formatter={(value: number) => [`EGP ${value}`, "Revenue"]}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar dataKey="revenue" fill="#1D5B70" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-gray-50 px-5 pb-4 pt-5 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {tabs.map((tab) => {
              const count = tab === "All" ? payments.length : payments.filter((p) => p.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === tab ? "text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                  style={activeTab === tab ? { backgroundColor: "#1D5B70" } : {}}
                >
                  {tab}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search payments..."
                className="h-9 w-52 rounded-xl border border-gray-200 pl-9 pr-4 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20"
              />
            </div>
            <button
              onClick={handleDownload}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {downloadToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-xl"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50">
                <CheckCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Download Started</p>
                <p className="text-xs text-gray-400">Payment report is downloading...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                {["Payment ID", "Order", "Customer", "Service", "Method", "Date", "Amount", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                        ["Service", "Date"].includes(heading) ? "hidden md:table-cell" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((payment, index) => {
                const config = statusConfig[payment.status];
                const Icon = config.icon;

                return (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition-colors hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: "#1D5B70" }}>
                        {payment.id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{payment.orderId}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{payment.customer}</p>
                    </td>
                    <td className="hidden px-4 py-3.5 text-sm text-gray-500 md:table-cell">
                      {payment.service}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{payment.method}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 text-sm text-gray-500 md:table-cell">
                      {payment.date}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-gray-900">
                        EGP {payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ color: config.color, backgroundColor: config.bg }}
                      >
                        <Icon className="h-3 w-3" />
                        {payment.status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}

              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    No payments match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3.5">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  onClick={() => setPage(value)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    value === safePage
                      ? "text-white"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                  style={value === safePage ? { backgroundColor: "#1D5B70" } : {}}
                >
                  {value}
                </button>
              ))}
              <button
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
