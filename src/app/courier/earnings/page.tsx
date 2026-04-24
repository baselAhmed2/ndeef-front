"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Package, Clock, CheckCircle2, XCircle, Wallet,
  Star, ArrowUpRight, ArrowDownRight, Calendar,
} from "lucide-react";

type Period = "today" | "week" | "month";

const DATA: Record<Period, {
  earned: number; orders: number; hours: number; cancelled: number;
  avgPerOrder: number; completionRate: number; trend: number;
}> = {
  today: { earned: 330, orders: 6, hours: 5.5, cancelled: 1, avgPerOrder: 55, completionRate: 85.7, trend: 12 },
  week:  { earned: 1850, orders: 34, hours: 38, cancelled: 3, avgPerOrder: 54.4, completionRate: 91.9, trend: 8 },
  month: { earned: 7200, orders: 138, hours: 152, cancelled: 9, avgPerOrder: 52.2, completionRate: 93.9, trend: -3 },
};

const CHART_BARS = [
  { day: "Mon", val: 280 }, { day: "Tue", val: 340 }, { day: "Wed", val: 190 },
  { day: "Thu", val: 420 }, { day: "Fri", val: 510 }, { day: "Sat", val: 330 }, { day: "Sun", val: 0 },
];
const RECENT_TRANSACTIONS = [
  { id: "o5", customer: "Laila Sameh",  area: "Maadi",       amount: 95, time: "1 hr ago",  status: "delivered" as const },
  { id: "o3", customer: "Nadia Hassan", area: "Mohandessin", amount: 55, time: "3 hrs ago", status: "delivered" as const },
  { id: "o6", customer: "Ahmed Ragab",  area: "Ain Shams",   amount: 60, time: "5 hrs ago", status: "delivered" as const },
  { id: "cx", customer: "Mona Saber",   area: "Heliopolis",  amount: 0,  time: "Yesterday", status: "cancelled" as const },
  { id: "o7", customer: "Hassan Nabil", area: "Dokki",       amount: 80, time: "Yesterday", status: "delivered" as const },
];
const MAX_BAR = Math.max(...CHART_BARS.map((b) => b.val));
const TODAY_IDX = 5;

export default function CourierEarningsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const stats = DATA[period];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Earnings</h1>
          <p className="text-gray-400 text-sm">Track your income and performance</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {(["today", "week", "month"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 h-8 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={period === p ? { backgroundColor: "#1D5B70" } : {}}>
              {p === "today" ? "Today" : p === "week" ? "This Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg"
          style={{ background: "linear-gradient(145deg, #1D5B70 0%, #2a7a9a 100%)" }}>
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
                {Math.abs(stats.trend)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Orders Done", value: stats.orders, icon: CheckCircle2 },
                { label: "Hours Active", value: `${stats.hours}h`, icon: Clock },
                { label: "Avg / Order", value: `EGP ${stats.avgPerOrder}`, icon: Wallet },
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
              <p className="text-xs text-gray-400">This week · EGP per day</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />Apr 6–12
            </div>
          </div>
          <div className="flex items-end gap-2 h-36">
            {CHART_BARS.map((bar, i) => {
              const pct = MAX_BAR > 0 ? (bar.val / MAX_BAR) * 100 : 0;
              const isToday = i === TODAY_IDX;
              return (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5">
                  {bar.val > 0 && <span className="text-[9px] font-bold text-gray-400">{isToday ? `${bar.val}` : ""}</span>}
                  <div className="flex-1 w-full flex items-end">
                    <motion.div initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, bar.val > 0 ? 4 : 0)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                      className="w-full rounded-xl"
                      style={{ backgroundColor: isToday ? "#EBA050" : "#1D5B70", opacity: bar.val === 0 ? 0.15 : isToday ? 1 : 0.55, minHeight: bar.val > 0 ? 6 : 3 }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: isToday ? "#EBA050" : "#94a3b8" }}>{bar.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#EBA050" }} /><span className="text-xs text-gray-500">Today (Sat)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded opacity-55" style={{ backgroundColor: "#1D5B70" }} /><span className="text-xs text-gray-500">Previous days</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="font-bold text-gray-800">Performance</p>
          {[
            { icon: Package, label: "Completion Rate", value: `${stats.completionRate}%`, pct: stats.completionRate, color: "#22c55e", delay: 0.2 },
            { icon: Star, label: "Customer Rating", value: "4.8 / 5.0", pct: 96, color: "#EBA050", delay: 0.4 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5"><item.icon className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600">{item.label}</span></div>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div key={period} initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1, delay: item.delay }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
            <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700">You&apos;re in the <strong>top 10%</strong> of couriers this week!</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="font-bold text-gray-800">Recent Transactions</p>
            <span className="text-xs text-gray-400">{RECENT_TRANSACTIONS.length} orders</span>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT_TRANSACTIONS.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: t.status === "delivered" ? "#f0fdf4" : "#fef2f2" }}>
                  {t.status === "delivered" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.customer}</p>
                  <p className="text-xs text-gray-400">{t.area} · {t.time}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${t.status === "delivered" ? "text-green-600" : "text-gray-300"}`}>
                  {t.status === "delivered" ? `+EGP ${t.amount}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EBA050" }}>
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400">Next scheduled payout</p>
          <p className="font-bold text-gray-900">EGP 1,850</p>
          <p className="text-xs text-amber-600 mt-0.5">Monday, April 14, 2026</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:opacity-80"
          style={{ borderColor: "#EBA050", color: "#EBA050" }}>
          Details <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
