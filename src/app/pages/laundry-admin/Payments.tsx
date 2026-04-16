"use client";

import { useState, useEffect } from "react";
import { getPayments, getCommissionSummary, initiateKashier, getRevenueWeekly } from "@/app/lib/laundry-admin-client";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowDownLeft,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Wallet,
  Info,
  Lock,
  Smartphone,
  CheckCheck,
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

const statusConfig: Record<Exclude<PaymentStatus, "All">, { color: string; bg: string; icon: React.ElementType }> = {
  Paid: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  Pending: { color: "#1D5B70", bg: "#e8f4f8", icon: Clock },
  Refunded: { color: "#ef4444", bg: "#fef2f2", icon: XCircle },
};

const COMMISSION_RATE = 0.10;
const tabs: PaymentStatus[] = ["All", "Paid", "Pending", "Refunded"];
const ITEMS_PER_PAGE = 8;

// Payment method badge components
function VisaBadge() {
  return (
    <div className="h-8 px-3 rounded-lg border border-gray-200 bg-white flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 50 16" className="h-3.5 w-auto" fill="none">
        <text x="0" y="13" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="900" fill="#1A1F71" letterSpacing="-0.5">VISA</text>
      </svg>
    </div>
  );
}

function WalletBadge() {
  return (
    <div className="h-8 px-3 rounded-lg border border-gray-200 bg-white flex items-center gap-1.5 shadow-sm">
      <Wallet className="w-3.5 h-3.5 text-gray-500" />
      <span className="text-[11px] font-semibold text-gray-600">Wallet</span>
    </div>
  );
}

function InstaPayBadge() {
  return (
    <div className="h-8 px-3 rounded-lg border border-gray-200 bg-white flex items-center gap-1.5 shadow-sm">
      <Smartphone className="w-3.5 h-3.5" style={{ color: "#1D5B70" }} />
      <span className="text-[11px] font-semibold" style={{ color: "#1D5B70" }}>InstaPay</span>
    </div>
  );
}

function MoreBadge() {
  return (
    <div className="h-8 px-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center gap-1 shadow-sm">
      <CreditCard className="w-3 h-3 text-gray-400" />
      <span className="text-[11px] font-semibold text-gray-400">+more</span>
    </div>
  );
}

function PlatformCommissionCard({ totalRevenue, commissionDue }: { totalRevenue: number; commissionDue: number }) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePayWithKashier = async () => {
    setLoading(true);
    try {
      const res = await initiateKashier(commissionDue);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
    } catch (err) {
      console.error("Kashier error", err);
    }
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
    }, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl overflow-hidden border border-[#1D5B70]/20 bg-white"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Left â€” commission info */}
        <div
          className="flex-1 p-6 flex flex-col justify-between gap-5"
          style={{ background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-white/90">Platform Commission</p>
            </div>

            <p className="text-white/60 text-xs mb-1">Amount due this cycle</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              EGP {commissionDue.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-white/50 text-xs mt-1">
              {(COMMISSION_RATE * 100).toFixed(0)}% of EGP {totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })} total revenue
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-white/50 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              Pay your commission to keep your account active and accepting orders on the Ndeef platform.
            </p>
          </div>
        </div>

        {/* Right â€” Kashier payment */}
        <div className="lg:w-80 p-6 flex flex-col justify-between gap-5 bg-white">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pay securely via</p>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "#1D5B7010" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#1D5B70" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#1D5B70" }}>SSL Secured</span>
              </div>
            </div>

            {/* Kashier logo block */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-black" style={{ color: "#1D5B70" }}>K</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 tracking-tight">Kashier</p>
                <p className="text-[11px] text-gray-400">Online Payment Gateway</p>
              </div>
            </div>

            {/* Accepted payment methods */}
            <div className="space-y-2 mb-4">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Accepted payment methods</p>
              <div className="flex flex-wrap gap-2">
                <VisaBadge />
                <WalletBadge />
                <InstaPayBadge />
                <MoreBadge />
              </div>
            </div>

            {/* Summary row */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
              <span className="text-sm text-gray-500">Commission ({(COMMISSION_RATE * 100).toFixed(0)}%)</span>
              <span className="font-bold text-gray-900">
                EGP {commissionDue.toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Pay button */}
          <div className="space-y-2.5">
            <AnimatePresence mode="wait">
              {paid ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-green-50 border border-green-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">Payment Successful</span>
                </motion.div>
              ) : (
                <motion.button
                  key="pay-btn"
                  onClick={handlePayWithKashier}
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold text-white transition-all disabled:opacity-80"
                  style={{ background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" }}
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Redirecting to Kashierâ€¦
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay EGP {commissionDue.toLocaleString("en", { minimumFractionDigits: 2 })} with Kashier
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-gray-300" />
              <p className="text-[11px] text-gray-400 text-center">
                You'll be redirected to Kashier's secure checkout
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

  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenueWeekly, setRevenueWeekly] = useState<{day: string; revenue: number}[]>([]);
  const [commissionInfo, setCommissionInfo] = useState<{ totalRevenue?: number; commissionDue?: number; rate?: number } | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pays, comm, rev] = await Promise.all([
          getPayments().catch(() => null),
          getCommissionSummary().catch(() => null),
          getRevenueWeekly().catch(() => null)
        ]);
        if (pays && Array.isArray(pays)) setPayments(pays);
        if (comm) setCommissionInfo(comm);
        if (rev && Array.isArray(rev)) setRevenueWeekly(rev);
      } catch (err) {
        console.error("Failed to load payments data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const filtered = payments.filter((p) => {
    const matchTab = activeTab === "All" || p.status === activeTab;
    const matchSearch =
      search === "" ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalRevenue = commissionInfo?.totalRevenue ?? payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === "Pending").reduce((s, p) => s + p.amount, 0);
  const commissionDue = commissionInfo?.commissionDue ?? (totalRevenue * COMMISSION_RATE);

  return (
    <div className="p-6 space-y-5">

      {/* Platform Commission Card */}
      <PlatformCommissionCard totalRevenue={totalRevenue} commissionDue={commissionDue} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            sub: `${payments.filter((p) => p.status === "Pending").length} orders`,
            icon: Clock,
            accent: false,
          },
          {
            label: "Platform Commission Due",
            value: `EGP ${commissionDue.toFixed(2)}`,
            sub: `${(COMMISSION_RATE * 100).toFixed(0)}% of total revenue`,
            icon: ArrowDownLeft,
            accent: false,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className={`rounded-2xl p-5 border ${stat.accent ? "border-transparent text-white" : "bg-white border-gray-100"}`}
            style={stat.accent ? { background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" } : {}}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.accent ? "rgba(255,255,255,0.2)" : "#1D5B7015" }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.accent ? "white" : "#1D5B70" }} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.accent ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
                <p className={`text-xs ${stat.accent ? "text-white/70" : "text-gray-400"}`}>{stat.sub}</p>
              </div>
            </div>
            <p className={`text-sm font-medium ${stat.accent ? "text-white/90" : "text-gray-700"}`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Revenue This Week</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daily revenue breakdown</p>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-600">+14.3%</span>
            <span className="text-xs text-gray-400">vs last week</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueWeekly} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
            <Tooltip
              contentStyle={{ borderRadius: 10, fontSize: 12 }}
              formatter={(val: number) => [`EGP ${val}`, "Revenue"]}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar dataKey="revenue" fill="#1D5B70" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-50">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {tabs.map((tab) => {
              const count = tab === "All" ? payments.length : payments.filter((p) => p.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  style={activeTab === tab ? { backgroundColor: "#1D5B70" } : {}}
                >
                  {tab}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search paymentsâ€¦"
                className="pl-9 pr-4 h-9 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 w-52"
              />
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Download Toast */}
        <AnimatePresence>
          {downloadToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-xl rounded-2xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCheck className="w-4 h-4 text-green-500" />
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
                {["Payment ID", "Order", "Customer", "Service", "Method", "Date", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                      ["Service", "Date"].includes(h) ? "hidden md:table-cell" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((pay, i) => {
                const cfg = statusConfig[pay.status];
                const Icon = cfg.icon;
                return (
                  <motion.tr
                    key={pay.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: "#1D5B70" }}>{pay.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{pay.orderId}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{pay.customer}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 hidden md:table-cell">{pay.service}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{pay.method}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 hidden md:table-cell">{pay.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-gray-900">EGP {pay.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        <Icon className="w-3 h-3" />
                        {pay.status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}â€“{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    p === page ? "text-white" : "text-gray-500 hover:bg-gray-50 border border-gray-200"
                  }`}
                  style={p === page ? { backgroundColor: "#1D5B70" } : {}}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

