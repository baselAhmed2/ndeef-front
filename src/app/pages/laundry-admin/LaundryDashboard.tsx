"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ShoppingBag,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  Truck,
} from "lucide-react";

const defaultRevenueData = [
  { month: "Jan", revenue: 3200, orders: 48 },
  { month: "Feb", revenue: 4100, orders: 62 },
  { month: "Mar", revenue: 3800, orders: 55 },
  { month: "Apr", revenue: 5200, orders: 78 },
  { month: "May", revenue: 4700, orders: 70 },
  { month: "Jun", revenue: 6100, orders: 91 },
  { month: "Jul", revenue: 5800, orders: 86 },
  { month: "Aug", revenue: 7200, orders: 108 },
  { month: "Sep", revenue: 6500, orders: 97 },
  { month: "Oct", revenue: 8100, orders: 121 },
  { month: "Nov", revenue: 7800, orders: 116 },
  { month: "Dec", revenue: 9200, orders: 138 },
];

const defaultOrderStatusData = [
  { name: "Delivered", value: 48, color: "#22c55e" },
  { name: "Processing", value: 23, color: "#1D5B70" },
  { name: "Pending", value: 15, color: "#EBA050" },
  { name: "Cancelled", value: 6, color: "#ef4444" },
  { name: "Ready", value: 8, color: "#8b5cf6" },
];

const defaultRecentOrders = [
  { id: "ORD-1024", customer: "Sarah Johnson", service: "Wash & Fold", items: 3, amount: 45.0, status: "Delivered", time: "2h ago" },
  { id: "ORD-1023", customer: "Mohammed Al-Rashid", service: "Dry Cleaning", items: 5, amount: 120.0, status: "Ready", time: "3h ago" },
  { id: "ORD-1022", customer: "Emily Chen", service: "Ironing", items: 8, amount: 32.0, status: "Processing", time: "5h ago" },
  { id: "ORD-1021", customer: "James Williams", service: "Wash & Fold", items: 2, amount: 28.0, status: "Pending", time: "6h ago" },
  { id: "ORD-1020", customer: "Fatima Al-Amin", service: "Dry Cleaning", items: 4, amount: 95.0, status: "Processing", time: "7h ago" },
  { id: "ORD-1019", customer: "Lucas Moreira", service: "Stain Removal", items: 1, amount: 55.0, status: "Delivered", time: "8h ago" },
];

const defaultTopServices = [
  { name: "Wash & Fold", orders: 138, revenue: 3840, growth: 12 },
  { name: "Dry Cleaning", orders: 94, revenue: 6580, growth: 8 },
  { name: "Ironing", orders: 72, revenue: 2160, growth: -3 },
  { name: "Stain Removal", orders: 41, revenue: 2255, growth: 21 },
];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Delivered: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  Processing: { color: "#1D5B70", bg: "#f0f9ff", icon: Loader2 },
  Pending: { color: "#EBA050", bg: "#fff7ed", icon: Clock },
  Ready: { color: "#8b5cf6", bg: "#f5f3ff", icon: Package },
  Cancelled: { color: "#ef4444", bg: "#fef2f2", icon: Truck },
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accent,
  delay = 0,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend: "up" | "down";
  trendValue: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl p-5 border ${accent ? "border-transparent text-white" : "bg-white border-gray-100"}`}
      style={accent ? { background: "linear-gradient(135deg, #1D5B70 0%, #2a7a9a 100%)" } : {}}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: accent ? "rgba(255,255,255,0.2)" : "#EBA050",
          }}
        >
          <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-white"}`} />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === "up"
              ? accent
                ? "bg-white/20 text-white"
                : "bg-green-50 text-green-600"
              : accent
              ? "bg-white/20 text-white"
              : "bg-red-50 text-red-500"
          }`}
        >
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendValue}
        </span>
      </div>
      <p className={`text-2xl font-bold mb-1 ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
      <p className={`text-sm font-medium mb-0.5 ${accent ? "text-white/90" : "text-gray-700"}`}>{title}</p>
      <p className={`text-xs ${accent ? "text-white/60" : "text-gray-400"}`}>{subtitle}</p>
    </motion.div>
  );
}

import { getDashboardSummary, getIncomingOrders, getRevenueMonthly } from "@/app/lib/laundry-admin-client";

export function LaundryDashboard() {
  const router = useRouter();
  const [chartPeriod, setChartPeriod] = useState<"6m" | "12m">("12m");

  const [revenueData, setRevenueData] = useState(defaultRevenueData);
  const [orderStatusData, setOrderStatusData] = useState(defaultOrderStatusData);
  const [recentOrders, setRecentOrders] = useState(defaultRecentOrders);
  const [topServices, setTopServices] = useState(defaultTopServices);
  const [stats, setStats] = useState({
    totalRevenue: 62400,
    totalOrders: 1284,
    completedOrders: 348,
    pendingOrders: 24,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [summary, incoming] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getIncomingOrders().catch(() => null)
        ]);
        if (summary?.revenueData) setRevenueData(summary.revenueData);
        if (summary?.orderStatusData) setOrderStatusData(summary.orderStatusData);
        if (summary?.topServices) setTopServices(summary.topServices);
        if (summary?.stats) {
          setStats({
            totalRevenue: summary.stats.totalRevenue,
            totalOrders: summary.stats.totalOrders,
            completedOrders: summary.stats.completedOrders,
            pendingOrders: summary.stats.pendingOrders,
          });
        }
        if (incoming && Array.isArray(incoming) && incoming.length > 0) setRecentOrders(incoming);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchChart() {
      if (chartPeriod === "12m") {
        const m = await getRevenueMonthly(new Date().getFullYear()).catch(() => null);
        if (m && Array.isArray(m) && m.length > 0) setRevenueData(m);
      }
    }
    fetchChart();
  }, [chartPeriod]);

  const chartData = chartPeriod === "6m" ? revenueData.slice(-6) : revenueData;

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`EGP ${stats.totalRevenue.toLocaleString()}`}
          subtitle="Delivered orders"
          icon={DollarSign}
          trend="up"
          trendValue={`${stats.totalOrders} orders`}
          accent
          delay={0}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          subtitle="Across your laundry"
          icon={ShoppingBag}
          trend="up"
          trendValue="Live backend data"
          delay={0.05}
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders.toLocaleString()}
          subtitle="Successfully delivered"
          icon={Users}
          trend="up"
          trendValue="Live backend data"
          delay={0.1}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          subtitle="Awaiting processing"
          icon={Clock}
          trend="up"
          trendValue="Needs attention"
          delay={0.15}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 min-w-0"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-gray-900 font-semibold">Revenue Overview</h2>
              <p className="text-gray-400 text-xs mt-0.5">Monthly revenue & orders trend</p>
            </div>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {(["6m", "12m"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    chartPeriod === p
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p === "6m" ? "6 Months" : "12 Months"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D5B70" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1D5B70" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EBA050" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EBA050" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(val: number, name: string) =>
                  name === "revenue" ? [`$${val.toLocaleString()}`, "Revenue"] : [val, "Orders"]
                }
              />
              <Area type="monotone" dataKey="revenue" stroke="#1D5B70" strokeWidth={2.5} fill="url(#revGradient)" dot={false} />
              <Area type="monotone" dataKey="orders" stroke="#EBA050" strokeWidth={2} fill="url(#ordGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 min-w-0"
        >
          <h2 className="text-gray-900 font-semibold mb-1">Order Status</h2>
          <p className="text-gray-400 text-xs mb-4">Current month breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>}
              />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h2 className="text-gray-900 font-semibold">Recent Orders</h2>
              <p className="text-gray-400 text-xs mt-0.5">Latest 6 orders</p>
            </div>
            <button
              onClick={() => router.push("/laundry-admin/orders")}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ color: "#1D5B70", backgroundColor: "#f0f9ff" }}
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const cfg = statusConfig[order.status] ?? statusConfig.Pending;
              const Icon = cfg.icon;
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/laundry-admin/orders/${order.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-all"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{order.id}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 truncate">{order.customer}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{order.service}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{order.items} items</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">${order.amount.toFixed(2)}</p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-300 shrink-0 hidden sm:block">{order.time}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 min-w-0"
        >
          <h2 className="text-gray-900 font-semibold mb-1">Top Services</h2>
          <p className="text-gray-400 text-xs mb-4">By revenue this month</p>
          <div className="space-y-4">
            {topServices.map((svc, i) => (
              <div key={svc.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: i === 0 ? "#EBA050" : "#1D5B70" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                  </div>
                  <span
                    className={`text-xs font-medium flex items-center gap-0.5 ${
                      svc.growth >= 0 ? "text-green-500" : "text-red-400"
                    }`}
                  >
                    {svc.growth >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(svc.growth)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(svc.revenue / 7000) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: i === 0 ? "#EBA050" : "#1D5B70" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-14 text-right">
                    ${svc.revenue.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{svc.orders} orders</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
