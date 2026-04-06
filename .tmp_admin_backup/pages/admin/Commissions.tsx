import { motion } from "motion/react";
import { Wallet, ArrowUpRight, DollarSign, Percent, Building2, Download, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import clsx from "clsx";

const monthlyCommissions = [
  { month: "Jan", earned: 7800, paid: 6200 }, { month: "Feb", earned: 8640, paid: 7500 },
  { month: "Mar", earned: 10200, paid: 9100 }, { month: "Apr", earned: 12480, paid: 11200 },
  { month: "May", earned: 11760, paid: 10800 }, { month: "Jun", earned: 17100, paid: 14500 },
];

const laundryTiers = [
  { tier: "Platinum", range: "> 1000 orders", rate: "8%", laundries: 12, revenue: "SAR 42.5K" },
  { tier: "Gold", range: "500-999 orders", rate: "10%", laundries: 45, revenue: "SAR 68.2K" },
  { tier: "Silver", range: "100-499 orders", rate: "12%", laundries: 128, revenue: "SAR 95.4K" },
  { tier: "Bronze", range: "< 100 orders", rate: "15%", laundries: 157, revenue: "SAR 38.1K" },
];

const pendingPayouts = [
  { laundry: "Al Jawhara Laundry", amount: 4580, due: "Apr 10, 2026", orders: 312, status: "Scheduled" },
  { laundry: "Clean & Care", amount: 3200, due: "Apr 10, 2026", orders: 245, status: "Scheduled" },
  { laundry: "Speed Wash Pro", amount: 2890, due: "Apr 10, 2026", orders: 198, status: "Processing" },
  { laundry: "Modern Laundry", amount: 1540, due: "Apr 10, 2026", orders: 102, status: "Scheduled" },
  { laundry: "Royal Cleaners", amount: 2100, due: "Apr 10, 2026", orders: 175, status: "Scheduled" },
];

const stats = [
  { label: "Total Commission Earned", value: "SAR 68.0K", trend: "+22%", icon: DollarSign, color: "from-emerald-500 to-emerald-600" },
  { label: "Pending Payouts", value: "SAR 14.3K", trend: "5 laundries", icon: Wallet, color: "from-[#EBA050] to-[#d68b3a]" },
  { label: "Avg. Commission Rate", value: "11.8%", trend: "-0.3%", icon: Percent, color: "from-[#1D6076] to-[#2a8ba8]" },
  { label: "Partner Laundries", value: "342", trend: "+4 new", icon: Building2, color: "from-violet-500 to-violet-600" },
];

export function Commissions() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Commissions & Payouts</h1>
          <p className="text-sm text-slate-500 mt-1">Financial overview and partner payouts</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50">
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className={clsx("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-3", s.color)}>
              <s.icon size={16} />
            </div>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            <span className="text-[10px] font-semibold text-emerald-600 mt-1 inline-block">{s.trend}</span>
          </div>
        ))}
      </div>

      {/* Commission Trend */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Commission vs Payouts</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1D6076]" />Earned</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EBA050]" />Paid</span>
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyCommissions} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)", fontSize: "12px" }} formatter={(v: number) => [`SAR ${v.toLocaleString()}`]} />
              <Bar dataKey="earned" fill="#1D6076" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="paid" fill="#EBA050" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Commission Tiers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Commission Tiers</h3>
          <div className="space-y-3">
            {laundryTiers.map((t) => (
              <div key={t.tier} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100/50">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{t.tier}</p>
                  <p className="text-[11px] text-slate-400">{t.range}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-[#1D6076]">{t.rate}</p>
                  <p className="text-[10px] text-slate-400">{t.laundries} laundries • {t.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Pending Payouts</h3>
            <button className="text-xs font-semibold text-[#1D6076] bg-[#1D6076]/5 px-2.5 py-1 rounded-lg">Process All</button>
          </div>
          <div className="space-y-2">
            {pendingPayouts.map((p) => (
              <div key={p.laundry} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{p.laundry}</p>
                  <p className="text-[10px] text-slate-400">{p.orders} orders • Due {p.due}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-slate-900">SAR {p.amount.toLocaleString()}</p>
                  <span className={clsx("text-[9px] font-semibold px-1.5 py-0.5 rounded", p.status === "Processing" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
