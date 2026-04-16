"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import {
  getDashboardSummary,
  getIncomingOrders,
  getRevenueMonthly,
  getServices,
} from "@/app/lib/laundry-admin-client";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

interface RevenuePoint {
  month: string;
  revenue: number;
  orders: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  serviceName: string;
  items: number;
  total: number;
  status: string;
  time: string;
}

interface ServiceShare {
  name: string;
  percentage: number;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = false,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string;
  subtitle: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={`rounded-2xl p-6 shadow-sm ${
        accent
          ? "bg-gradient-to-br from-[#0f4c5c] to-[#2a9d8f] text-white"
          : "border border-gray-100 bg-white"
      }`}
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
          accent ? "bg-white/20" : "bg-[#0f4c5c]/10"
        }`}
      >
        <Icon className={`h-6 w-6 ${accent ? "text-white" : "text-[#0f4c5c]"}`} />
      </div>
      <p className={`text-sm ${accent ? "text-white/70" : "text-gray-500"}`}>{label}</p>
      <p className={`mt-1 text-3xl font-black ${accent ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
      <p className={`mt-2 text-xs ${accent ? "text-white/60" : "text-gray-400"}`}>
        {subtitle}
      </p>
    </motion.div>
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "ready":
      return "bg-orange-100 text-orange-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function LaundryDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [topServices, setTopServices] = useState<ServiceShare[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [summary, orders, revenue, services] = await Promise.all([
          getDashboardSummary(),
          getIncomingOrders(),
          getRevenueMonthly(new Date().getFullYear()),
          getServices(),
        ]);

        setStats({
          totalRevenue: summary.stats?.totalRevenue ?? 0,
          totalOrders: summary.stats?.totalOrders ?? 0,
          completedOrders: summary.stats?.completedOrders ?? 0,
          pendingOrders: summary.stats?.pendingOrders ?? 0,
        });

        setRecentOrders(
          orders.slice(0, 6).map((order: any) => ({
            id: order.id || `ORD-${order.orderId}`,
            customerName: order.customer || "Unknown",
            serviceName: order.service || "Laundry Service",
            items: order.items || 1,
            total: order.amount || 0,
            status: order.status || "Pending",
            time: order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recently",
          })),
        );

        setRevenueData(
          revenue.map((point) => ({
            month: point.month,
            revenue: point.revenue,
            orders: point.orders,
          })),
        );

        const serviceTotals = services.reduce<Record<string, number>>((acc, service) => {
          acc[service.name] = (acc[service.name] ?? 0) + (service.price || 0);
          return acc;
        }, {});
        const totalServiceValue = Object.values(serviceTotals).reduce((sum, value) => sum + value, 0);
        setTopServices(
          Object.entries(serviceTotals)
            .map(([name, value]) => ({
              name,
              percentage: totalServiceValue > 0 ? Math.round((value / totalServiceValue) * 100) : 0,
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f4c5c]/5 to-[#2a9d8f]/5">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#0f4c5c]" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f4c5c]/5 via-white to-[#fff7ed] p-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-[#1D5B70]/5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#EBA050]">
            Laundry Admin
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Live operational overview from the backend.
          </p>
          {error && (
            <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
              {error}
            </div>
          )}
        </motion.div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={currency.format(stats.totalRevenue)}
            subtitle="Delivered orders"
            accent
            delay={0}
          />
          <StatCard
            icon={Package}
            label="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            subtitle="Across your laundry"
            delay={0.1}
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Orders"
            value={stats.completedOrders.toLocaleString()}
            subtitle="Successfully delivered"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={stats.pendingOrders.toLocaleString()}
            subtitle="Needs attention"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500">Latest orders from the backend</p>
              </div>
              <button
                onClick={() => router.push("/laundry-admin/orders")}
                className="flex items-center gap-2 text-sm font-semibold text-[#0f4c5c] transition hover:text-[#2a9d8f]"
              >
                View All <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id || index}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.08 }}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f4c5c] to-[#2a9d8f] font-bold text-white">
                        {order.id.slice(-2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{order.id}</p>
                        <p className="truncate text-sm text-gray-500">
                          {order.customerName} - {order.serviceName} - {order.items} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{currency.format(order.total)}</p>
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                      <p className="mt-1 text-xs text-gray-400">{order.time}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
                  No recent orders found
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Service Mix</h2>
                <p className="text-sm text-gray-500">Based on configured service prices</p>
              </div>
              <Sparkles className="h-5 w-5 text-[#EBA050]" />
            </div>

            <div className="space-y-4">
              {topServices.length > 0 ? (
                topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0f4c5c] to-[#2a9d8f] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        <span className="text-sm font-bold text-[#0f4c5c]">{service.percentage}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${service.percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.08, duration: 0.45 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#0f4c5c] to-[#2a9d8f]"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-400">
                  No services data
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">Monthly Revenue</h2>
            <p className="text-sm text-gray-500">Current year delivered revenue</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {revenueData.map((point) => (
              <div key={point.month} className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{point.month}</p>
                <p className="mt-2 text-lg font-black text-gray-950">{currency.format(point.revenue)}</p>
                <p className="text-xs text-gray-400">{point.orders} orders</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
