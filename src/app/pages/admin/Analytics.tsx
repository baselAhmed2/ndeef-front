import { motion } from "motion/react";
import { useState } from "react";
import {
  TrendingUp, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight,
  Download
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import clsx from "clsx";

const weeklyRevenue = [
  { day: "Sat", revenue: 18500, orders: 245 }, { day: "Sun", revenue: 22300, orders: 312 },
  { day: "Mon", revenue: 19800, orders: 267 }, { day: "Tue", revenue: 24100, orders: 334 },
  { day: "Wed", revenue: 21600, orders: 298 }, { day: "Thu", revenue: 26800, orders: 378 },
  { day: "Fri", revenue: 28400, orders: 402 },
];

const serviceBreakdown = [
  { name: "Wash & Fold", value: 42, color: "#1D6076" },
  { name: "Dry Clean", value: 28, color: "#EBA050" },
  { name: "Iron Only", value: 18, color: "#10b981" },
  { name: "Special Care", value: 12, color: "#8b5cf6" },
];

const customerRetention = [
  { month: "Jan", newUsers: 420, returning: 680 }, { month: "Feb", newUsers: 510, returning: 720 },
  { month: "Mar", newUsers: 580, returning: 790 }, { month: "Apr", newUsers: 650, returning: 870 },
  { month: "May", newUsers: 590, returning: 920 }, { month: "Jun", newUsers: 720, returning: 1020 },
];

const avgOrderValue = [
  { month: "Jan", aov: 78 }, { month: "Feb", aov: 82 }, { month: "Mar", aov: 85 },
  { month: "Apr", aov: 91 }, { month: "May", aov: 88 }, { month: "Jun", aov: 95 },
];

const performanceMetrics = [
  { name: "Order Completion", value: 94.7, fill: "#10b981" },
  { name: "Customer Satisfaction", value: 92.3, fill: "#1D6076" },
  { name: "On-time Delivery", value: 89.1, fill: "#EBA050" },
  { name: "App Engagement", value: 78.5, fill: "#8b5cf6" },
];

const topMetrics = [
  { label: "Total Revenue", value: "SAR 161.5K", change: "+18.2%", isUp: true, icon: DollarSign },
  { label: "Total Orders", value: "2,236", change: "+14.5%", isUp: true, icon: Package },
  { label: "Avg. Order Value", value: "SAR 95", change: "+8.4%", isUp: true, icon: TrendingUp },
  { label: "Active Customers", value: "4,821", change: "-2.1%", isUp: false, icon: Users },
];

export function Analytics() {
  const [period, setPeriod] = useState("week");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Deep dive into platform performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "quarter", label: "Quarter" },
          ].map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", period === p.key ? "bg-[#1D6076] text-white" : "bg-white text-slate-500 border border-slate-200")}>
              {p.label}
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-500 font-semibold hover:bg-slate-50">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {topMetrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <m.icon size={16} className="text-slate-400" />
              <span className={clsx("flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded", m.isUp ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50")}>
                {m.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{m.change}
              </span>
            </div>
            <p className="text-xs text-slate-400">{m.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Orders Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Revenue & Orders Trend</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1D6076]" />Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EBA050]" />Orders</span>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D6076" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D6076" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}K`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)", fontSize: "12px" }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#1D6076" strokeWidth={2.5} fill="url(#gRevA)" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#EBA050" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Service Breakdown</h3>
          <div className="flex items-center gap-6">
            <PieChart width={160} height={160}>
              <Pie data={serviceBreakdown} cx={80} cy={80} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {serviceBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-3">
              {serviceBreakdown.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-slate-600">{s.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Retention */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New vs Returning Customers</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerRetention} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)", fontSize: "12px" }} />
                <Bar dataKey="newUsers" name="New" fill="#EBA050" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="returning" name="Returning" fill="#1D6076" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AOV Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Average Order Value Trend</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgOrderValue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v} SAR`} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.08)", fontSize: "12px" }} />
                <Line type="monotone" dataKey="aov" stroke="#1D6076" strokeWidth={2.5} dot={{ fill: "#1D6076", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Performance Scores</h3>
          <div className="space-y-4">
            {performanceMetrics.map((m) => (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">{m.name}</span>
                  <span className="text-xs font-bold text-slate-800">{m.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: m.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
