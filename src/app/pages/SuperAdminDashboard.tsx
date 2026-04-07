"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Store,
  Users,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { apiRequest, ApiError } from "../lib/admin-api";
import { useAuth } from "../context/AuthContext";

interface SystemAnalyticsData {
  totalRevenue: number;
  revenueGrowth: string;
  totalOrders: number;
  ordersToday: number;
  ordersTodayGrowth: string;
  activeLaundries: number;
  laundriesGrowth: string;
  totalUsers: number;
  usersGrowth: string;
  monthlyRevenue: { month: string; revenue: number; orders: number; profit: number }[];
  orderStatusDistribution: { name: string; value: number; color: string }[];
  topPerformingLaundries: { id: number; name: string; city: string; orders: string; rev: string }[];
  ordersByCity: { name: string; value: number; color: string }[];
  recentOrders: { id: string; customer: string; laundry: string; amount: string; time: string; status: string }[];
  healthScore: number;
  uptime: number;
  avgRating: number;
}

function formatTimeAgo(isoString: string) {
  const date = new Date(isoString);
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// Data now comes securely from the backend API

function getStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold"><CheckCircle2 size={12} /> Completed</span>;
    case "In Progress":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold"><Clock size={12} /> In Progress</span>;
    case "Pending":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-semibold"><AlertCircle size={12} /> Pending</span>;
    case "Cancelled":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold"><XCircle size={12} /> Cancelled</span>;
    default:
      return null;
  }
}

export function SuperAdminDashboard() {
  const { isAuthReady, isLoggedIn, user } = useAuth();
  const [data, setData] = useState<SystemAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normalizedRole = (user?.role ?? "").toLowerCase();
  const isSuperAdmin = normalizedRole.includes("superadmin");

  const loadDashboard = useCallback(async () => {
    if (!user?.token) {
      setData(null);
      setError("Your session is missing a valid token. Please sign in again.");
      setLoading(false);
      return;
    }

    if (!isSuperAdmin) {
      setData(null);
      setError(`This account has role "${user?.role ?? "Unknown"}" and cannot access system analytics.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<SystemAnalyticsData>("/analytics/system");
      setData(response);
    } catch (err) {
      console.error("Dashboard hook failed", err);
      setData(null);
      setError(
        err instanceof ApiError
          ? err.status === 401 || err.status === 403
            ? "This dashboard is only available to a signed-in SuperAdmin."
            : err.message
          : err instanceof Error
            ? err.message
            : "Could not load system analytics. Sign in as SuperAdmin and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, user?.role, user?.token]);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !user?.token) {
      setData(null);
      setError("Please sign in with a SuperAdmin account to view the dashboard.");
      setLoading(false);
      return;
    }

    if (!isSuperAdmin) {
      setData(null);
      setError(`This account has role "${user.role}" and cannot access system analytics.`);
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [isAuthReady, isLoggedIn, isSuperAdmin, loadDashboard, user?.role, user?.token]);

  if (loading || !isAuthReady) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A5C66]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-6 text-center max-w-lg mx-auto mt-12">
        <p className="text-sm font-medium text-red-800 mb-1">Dashboard data unavailable</p>
        <p className="text-xs text-red-700/90 mb-4">{error ?? "No data returned."}</p>
        <p className="text-[11px] text-slate-500 mb-4">
          Backend: <code className="bg-white/80 px-1 rounded">GET /api/analytics/system</code> requires role{" "}
          <strong>SuperAdmin</strong> and a valid JWT (same session as the app).
        </p>
        <button
          type="button"
          onClick={() => loadDashboard()}
          className="text-sm font-semibold text-white bg-[#2A5C66] rounded-xl px-4 py-2 hover:bg-[#2A5C66]/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Dashboard Overview</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Data from <code className="text-[11px] bg-slate-100 px-1 rounded">GET /api/analytics/system</code> (SuperAdmin).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 text-slate-700 text-[13px] rounded-xl px-4 py-2 outline-none focus:border-[#2A5C66] focus:ring-1 focus:ring-[#2A5C66]">
             <option>Last 30 Days</option>
             <option>Last 7 Days</option>
             <option>This Year</option>
          </select>
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,Metric,Value\nTotal Revenue," + data.totalRevenue + "\nActive Laundries," + data.activeLaundries;
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "system_report.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-[#2A5C66] hover:bg-[#2A5C66]/90 text-white text-[13px] font-semibold rounded-xl px-5 py-2 shadow-sm transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* 4 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              {data.revenueGrowth?.startsWith("-") ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {data.revenueGrowth}
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Total Revenue</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">EGP {data.totalRevenue?.toLocaleString("en-US", { maximumFractionDigits: 1 }) || 0}</h3>
        </div>

        {/* Laundries */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#2A5C66]/10 text-[#2A5C66] flex items-center justify-center">
              <Store size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              {data.laundriesGrowth?.startsWith("-") ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {data.laundriesGrowth}
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Active Laundries</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{data.activeLaundries || 0}</h3>
        </div>

        {/* Users */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              {data.usersGrowth?.startsWith("-") ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {data.usersGrowth}
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Total Users</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{data.totalUsers?.toLocaleString() || 0}</h3>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              {data.ordersTodayGrowth?.startsWith("-") ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {data.ordersTodayGrowth}
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Orders Today</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{data.ordersToday?.toLocaleString() || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Line Chart */}
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue & Profit Overview</h2>
              <p className="text-xs text-slate-400 mt-1">Monthly tracking across all partner laundries</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#2A5C66]" /><span className="text-xs font-semibold text-slate-600">Revenue</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#EBA050]" /><span className="text-xs font-semibold text-slate-600">Profit</span></div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRevenue} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(val) => `EGP ${val}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`EGP ${value}K`, ""]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#2A5C66" strokeWidth={3} strokeLinecap="round" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, stroke: "#2A5C66", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="profit" stroke="#EBA050" strokeWidth={3} strokeLinecap="round" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, stroke: "#EBA050", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm p-6 flex flex-col">
          <div>
            <h2 className="text-base font-bold text-slate-800">Order Status</h2>
            <p className="text-xs text-slate-400 mt-1">Current state of 6.2K tracked orders</p>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center mt-4 relative">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.orderStatusDistribution || []} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                    {(data.orderStatusDistribution || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-bold text-slate-800">{data.totalOrders > 1000 ? (data.totalOrders / 1000).toFixed(1) + 'K' : data.totalOrders}</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Total Orders</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {(data.orderStatusDistribution || []).map((s: any) => (
              <div key={s.name} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-slate-500">{s.name}</p>
                  <p className="text-[13px] font-bold text-slate-800">
                    {data.totalOrders === 0 ? 0 : Math.round((s.value / data.totalOrders) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Laundries Table */}
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Top Performing Laundries</h2>
              <p className="text-xs text-slate-400 mt-1">Ranked by completed order volume</p>
            </div>
            <button className="text-[12px] font-semibold text-[#2A5C66] hover:bg-[#2A5C66]/10 px-3 py-1.5 rounded-lg transition-colors">View All</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 rounded-tl-lg">Rank</th>
                  <th className="px-5 py-3">Laundry Name</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3 rounded-tr-lg">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 text-[13px]">
                {(data.topPerformingLaundries || []).map((laundry: any, i: number) => (
                  <tr key={laundry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${i < 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                        #{i + 1}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{laundry.name}</p>
                      <p className="text-[11px] text-slate-400">{laundry.city}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-600">{laundry.orders}</td>
                    <td className="px-5 py-3 font-bold text-[#2A5C66]">{laundry.rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by City & Recent Orders */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Orders by City</h2>
            </div>
            <div className="space-y-3">
              {(data.ordersByCity || []).map((city: any) => (
                <div key={city.name} className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-slate-600 w-16 truncate">{city.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${city.value}%`, backgroundColor: city.color }} />
                  </div>
                  <span className="text-[12px] font-bold text-slate-800 w-8 text-right">{city.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col flex-1">
            <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Orders</h2>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {(data.recentOrders || []).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800">{order.id} &bull; <span className="font-semibold text-slate-600">{order.customer}</span></span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {order.laundry} &bull;{" "}
                      {Number.isNaN(Date.parse(order.time)) ? order.time : formatTimeAgo(order.time)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[13px] font-bold text-slate-800">{order.amount}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health Score Card */}
      <div className="bg-gradient-to-r from-[#2A5C66] to-[#1D404A] rounded-[24px] p-6 text-white shadow-xl shadow-[#2A5C66]/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={160} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h2 className="text-xl font-bold">Platform Health IS OPTIMAL</h2>
               <p className="text-emerald-100 text-sm mt-1 max-w-md">System is running smoothly with 99.9% uptime and excellent satisfaction ratings locally and regionally.</p>
            </div>
            <div className="flex items-center gap-6 divide-x divide-white/20">
               <div className="px-4">
                  <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase mb-1">Health Score</p>
                  <p className="text-3xl font-bold">{data.healthScore || 94.7}%</p>
               </div>
               <div className="px-4">
                  <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase mb-1">Uptime</p>
                  <p className="text-3xl font-bold">{data.uptime || 99.9}%</p>
               </div>
               <div className="px-4">
                  <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold flex items-center gap-1">{data.avgRating || 4.7} <span className="text-yellow-400">★</span></p>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
