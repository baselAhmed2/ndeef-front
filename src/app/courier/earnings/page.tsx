"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
  Info,
} from "lucide-react";
import { getCourierEarnings, getCourierTodayStats, type CourierEarningsResponseDto, type CourierTodayStatsDto } from "@/app/lib/courier-client";
import { ApiError } from "@/app/lib/admin-api";

type Period = "today" | "week";

function buildStats(period: Period, earnings: CourierEarningsResponseDto, today: CourierTodayStatsDto) {
  if (period === "today") {
    const avgPerOrder = today.todaysOrders > 0 ? today.earnedToday / today.todaysOrders : 0;
    return {
      earned: today.earnedToday,
      orders: today.todaysOrders,
      hours: earnings.hoursActive,
      cancelled: earnings.cancelled,
      avgPerOrder,
      completionRate: earnings.completionRate,
      trend: today.vsYesterdayPercentage,
    };
  }

  return {
    earned: earnings.totalEarned,
    orders: earnings.ordersDone,
    hours: earnings.hoursActive,
    cancelled: earnings.cancelled,
    avgPerOrder: earnings.avgPerOrder,
    completionRate: earnings.completionRate,
    trend: today.vsYesterdayPercentage,
  };
}

export default function CourierEarningsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [earnings, setEarnings] = useState<CourierEarningsResponseDto | null>(null);
  const [todayStats, setTodayStats] = useState<CourierTodayStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [earningsResult, todayResult] = await Promise.all([getCourierEarnings(), getCourierTodayStats()]);
        if (ignore) return;
        setEarnings(earningsResult);
        setTodayStats(todayResult);
      } catch (loadError) {
        if (ignore) return;
        setError(loadError instanceof ApiError ? loadError.message : "Unable to load courier earnings.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!earnings || !todayStats) return null;
    return buildStats(period, earnings, todayStats);
  }, [earnings, period, todayStats]);

  const maxBar = useMemo(
    () => Math.max(1, ...(earnings?.dailyEarnings.map((item) => item.amount) ?? [0])),
    [earnings],
  );
  const todayIdx = useMemo(
    () => (earnings?.dailyEarnings.findIndex((item) => item.amount === todayStats?.earnedToday) ?? -1),
    [earnings, todayStats],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D5B70]" />
        <p className="text-sm text-gray-500 mt-3">Loading earnings...</p>
      </div>
    );
  }

  if (error || !earnings || !todayStats || !stats) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-sm text-red-700">
          {error || "Unable to load courier earnings."}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Earnings</h1>
          <p className="text-gray-400 text-sm">Track your income and performance</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {(["today", "week"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 h-8 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={period === p ? { backgroundColor: "#1D5B70" } : {}}
            >
              {p === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg" style={{ background: "linear-gradient(145deg, #1D5B70 0%, #2a7a9a 100%)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white" style={{ transform: "translate(30%,-30%)" }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs mb-1">Total Earned</p>
                <p className="text-4xl font-bold">EGP</p>
                <motion.p key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold">
                  {stats.earned.toLocaleString()}
                </motion.p>
              </div>
              <div className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold ${stats.trend >= 0 ? "bg-green-400/20 text-green-200" : "bg-red-400/20 text-red-200"}`}>
                {stats.trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(stats.trend).toFixed(0)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Orders Done", value: stats.orders, icon: CheckCircle2 },
                { label: "Hours Active", value: `${stats.hours}h`, icon: Clock },
                { label: "Avg / Order", value: `EGP ${stats.avgPerOrder.toFixed(1)}`, icon: Wallet },
                { label: "Cancelled", value: stats.cancelled, icon: XCircle },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 rounded-xl p-2.5">
                  <s.icon className="w-4 h-4 text-white/60 mb-1" />
                  <p className="text-base font-bold">{s.value}</p>
                  <p className="text-[10px] text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-800">Daily Earnings</p>
              <p className="text-xs text-gray-400">Backend summary · EGP per day</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              Current week
            </div>
          </div>
          <div className="flex items-end gap-2 h-36">
            {earnings.dailyEarnings.map((bar, i) => {
              const pct = maxBar > 0 ? (bar.amount / maxBar) * 100 : 0;
              const isToday = i === todayIdx;
              return (
                <div key={`${bar.day}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
                  {bar.amount > 0 && <span className="text-[9px] font-bold text-gray-400">{isToday ? `${bar.amount}` : ""}</span>}
                  <div className="flex-1 w-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, bar.amount > 0 ? 4 : 0)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                      className="w-full rounded-xl"
                      style={{
                        backgroundColor: isToday ? "#EBA050" : "#1D5B70",
                        opacity: bar.amount === 0 ? 0.15 : isToday ? 1 : 0.55,
                        minHeight: bar.amount > 0 ? 6 : 3,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: isToday ? "#EBA050" : "#94a3b8" }}>
                    {bar.day}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#EBA050" }} />
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded opacity-55" style={{ backgroundColor: "#1D5B70" }} />
              <span className="text-xs text-gray-500">Other days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="font-bold text-gray-800">Performance</p>
          {[
            {
              icon: Package,
              label: "Completion Rate",
              value: `${stats.completionRate.toFixed(1)}%`,
              pct: `${stats.completionRate}%`,
              color: "#22c55e",
              delay: 0.2,
            },
            {
              icon: Wallet,
              label: "Avg / Order",
              value: `EGP ${stats.avgPerOrder.toFixed(1)}`,
              pct: `${Math.max(8, Math.min(100, stats.orders > 0 ? (stats.avgPerOrder / Math.max(stats.earned, 1)) * 100 : 8))}%`,
              color: "#EBA050",
              delay: 0.4,
            },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  key={period}
                  initial={{ width: 0 }}
                  animate={{ width: item.pct }}
                  transition={{ duration: 1, delay: item.delay }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <Info className="mt-0.5 w-4 h-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              Backend does not currently provide tracked courier ratings, ranking, or hours worked. This page only shows earnings and completion metrics calculated directly by backend.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="font-bold text-gray-800">Recent Transactions</p>
            <span className="text-xs text-gray-400">{earnings.recentTransactions.length} orders</span>
          </div>
          <div className="divide-y divide-gray-50">
            {earnings.recentTransactions.map((transaction, index) => {
              const delivered = transaction.amount.trim() !== "—" && transaction.amount.trim() !== "-";
              return (
                <div key={`${transaction.customer}-${index}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: delivered ? "#f0fdf4" : "#fef2f2" }}>
                    {delivered ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{transaction.customer}</p>
                    <p className="text-xs text-gray-400">
                      {transaction.area} · {transaction.timeAgo}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${delivered ? "text-green-600" : "text-gray-300"}`}>{transaction.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EBA050" }}>
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400">Next scheduled payout</p>
          <p className="font-bold text-gray-900">EGP {earnings.nextPayoutAmount}</p>
          <p className="text-xs text-amber-600 mt-0.5">{earnings.nextPayoutDate}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border bg-amber-50" style={{ borderColor: "#fcd34d", color: "#b45309" }}>
          Backend summary <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
        </div>
      </div>
    </motion.div>
  );
}
