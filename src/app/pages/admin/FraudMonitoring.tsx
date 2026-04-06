import { motion } from "motion/react";
import { useState } from "react";
import {
  ShieldAlert, AlertTriangle, Shield, CheckCircle, Eye, Ban,
  TrendingUp, Clock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import clsx from "clsx";

const fraudTrend = [
  { day: "Mon", alerts: 3 }, { day: "Tue", alerts: 5 }, { day: "Wed", alerts: 2 },
  { day: "Thu", alerts: 8 }, { day: "Fri", alerts: 4 }, { day: "Sat", alerts: 6 }, { day: "Sun", alerts: 3 },
];

const alerts = [
  { id: "FA-901", type: "Fake Payments", description: "Multiple failed payment attempts with different cards on order #4421", user: "Ali K.", userType: "Customer", risk: "Critical", time: "10 min ago", amount: "SAR 1,240", status: "Open" },
  { id: "FA-902", type: "High Cancellation Rate", description: "Laundry has cancelled 15 orders in 2 hours - abnormal pattern", user: "Al Noor Laundry", userType: "Laundry", risk: "High", time: "1 hour ago", amount: "SAR 3,800", status: "Investigating" },
  { id: "FA-903", type: "Duplicate Accounts", description: "3 accounts sharing same device ID and payment method", user: "Mohammed S.", userType: "Customer", risk: "Medium", time: "3 hours ago", amount: "SAR 650", status: "Open" },
  { id: "FA-904", type: "Suspicious Rating Boost", description: "50 5-star ratings within 1 hour from newly created accounts", user: "Speed Clean", userType: "Laundry", risk: "High", time: "5 hours ago", amount: "-", status: "Open" },
  { id: "FA-905", type: "Promo Code Abuse", description: "Same promo code used 12 times from related accounts", user: "Faisal R.", userType: "Customer", risk: "Medium", time: "8 hours ago", amount: "SAR 480", status: "Resolved" },
  { id: "FA-906", type: "Chargeback Pattern", description: "3 chargebacks in 7 days from same customer", user: "Hamad T.", userType: "Customer", risk: "Critical", time: "12 hours ago", amount: "SAR 890", status: "Investigating" },
];

const riskColor: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusColor: Record<string, string> = {
  Open: "bg-red-50 text-red-600",
  Investigating: "bg-blue-50 text-blue-600",
  Resolved: "bg-emerald-50 text-emerald-600",
};

const summaryCards = [
  { label: "Open Alerts", value: "12", icon: AlertTriangle, color: "from-red-500 to-red-600", bg: "bg-red-50" },
  { label: "Under Investigation", value: "5", icon: Eye, color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
  { label: "Resolved This Week", value: "28", icon: CheckCircle, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
  { label: "Risk Score", value: "32/100", icon: Shield, color: "from-[#1D6076] to-[#2a8ba8]", bg: "bg-[#1D6076]/5" },
];

export function FraudMonitoring() {
  const [filter, setFilter] = useState("All");

  const filtered = alerts.filter((a) => filter === "All" || a.risk === filter || a.status === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fraud Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time fraud detection and risk analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className={clsx("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-3", s.color)}>
              <s.icon size={16} />
            </div>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Weekly Fraud Alert Trend</h3>
          <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">
            <TrendingUp size={12} /> +15% this week
          </span>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fraudTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)", fontSize: "12px" }} />
              <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {["All", "Critical", "High", "Medium", "Open", "Investigating", "Resolved"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={clsx("px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all", filter === f ? "bg-[#1D6076] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((a) => (
            <motion.div key={a.id} layout className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", a.risk === "Critical" ? "bg-red-100 text-red-600" : a.risk === "High" ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-600")}>
                    {a.risk === "Critical" ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13px] font-semibold text-slate-800">{a.type}</h4>
                      <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded border", riskColor[a.risk])}>{a.risk}</span>
                      <span className={clsx("text-[9px] font-semibold px-1.5 py-0.5 rounded", statusColor[a.status])}>{a.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{a.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span>{a.user} ({a.userType})</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{a.time}</span>
                      {a.amount !== "-" && <><span>•</span><span className="font-semibold text-slate-500">{a.amount}</span></>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#1D6076]"><Eye size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Ban size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
