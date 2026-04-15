"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  getDashboardSummary,
  getIncomingOrders,
  getRevenueMonthly,
  getRevenueWeekly,
  getServices,
} from "@/app/lib/laundry-admin-client";
import { mockDashboardData, mockOrders, mockServices } from "@/app/lib/mock-data";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface Order {
  id: string;
  customerName: string;
  serviceName: string;
  items: number;
  total: number;
  status: string;
  time: string;
}

interface Service {
  name: string;
  percentage: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  accent = false,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string;
  subtitle: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-6 rounded-2xl ${
        accent
          ? "bg-gradient-to-br from-[#0f4c5c] to-[#2a9d8f] text-white"
          : "bg-white border border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl ${
            accent ? "bg-white/20" : "bg-[#0f4c5c]/10"
          }`}
        >
          <Icon className={`w-6 h-6 ${accent ? "text-white" : "text-[#0f4c5c]"}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trend === "up"
                ? accent
                  ? "text-green-300"
                  : "text-green-600"
                : accent
                ? "text-red-300"
                : "text-red-600"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>12%</span>
          </div>
        )}
      </div>
      <h3 className={`text-sm mb-1 ${accent ? "text-white/70" : "text-gray-500"}`}>
        {label}
      </h3>
      <p
        className={`text-3xl font-bold mb-2 ${
          accent ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      <p className={`text-xs ${accent ? "text-white/60" : "text-gray-400"}`}>
        {subtitle}
      </p>
    </motion.div>
  );
}

export default function LaundryDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topServices, setTopServices] = useState<Service[]>([]);

  // Debug function for console testing
  useEffect(() => {
    (window as any).testDashboardAPI = async () => {
      console.log("🔍 Testing Dashboard APIs...");
      try {
        const summary = await getDashboardSummary();
        console.log("✅ Dashboard Summary:", summary);
      } catch (e) {
        console.error("❌ Summary failed:", e);
      }
      try {
        const orders = await getIncomingOrders();
        console.log("✅ Orders:", orders);
      } catch (e) {
        console.error("❌ Orders failed:", e);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard summary
        try {
          const summary = await getDashboardSummary();
          console.log("Dashboard Summary:", summary);

          if (summary) {
            setStats({
              totalRevenue: summary.stats?.totalRevenue || 0,
              totalOrders: summary.stats?.totalOrders || 0,
              completedOrders: summary.stats?.completedOrders || 0,
              pendingOrders: summary.stats?.pendingOrders || 0,
            });
          }
        } catch (e) {
          console.error("Summary failed:", e);
        }

        // Fetch recent orders
        try {
          const orders = await getIncomingOrders();
          console.log("Incoming Orders:", orders);

          if (orders && Array.isArray(orders)) {
            const formattedOrders = orders.slice(0, 6).map((order: any) => ({
              id: order.id || `ORD-${order.orderId}`,
              customerName: order.customer || "Unknown",
              serviceName: order.service || "Service",
              items: order.items || 1,
              total: order.amount || 0,
              status: order.status || "Pending",
              time: order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : "Recently",
            }));
            setRecentOrders(formattedOrders);
          }
        } catch (e) {
          console.error("Orders failed:", e);
        }

        // Fetch revenue data
        try {
          const currentYear = new Date().getFullYear();
          const revenue = await getRevenueMonthly(currentYear);
          console.log("Revenue Data:", revenue);

          if (revenue && Array.isArray(revenue) && revenue.length > 0) {
            setRevenueData(
              revenue.map((r: any) => ({
                month: r.month || r.period || "",
                revenue: r.revenue || r.totalRevenue || 0,
                orders: r.orders || r.orderCount || 0,
              }))
            );
          }
        } catch (e) {
          console.error("Revenue failed:", e);
        }

        // Fetch services for top services
        try {
          const services = await getServices();
          console.log("Services:", services);

          if (services && Array.isArray(services) && services.length > 0) {
            const serviceStats: Record<string, number> = {};
            services.forEach((s: any) => {
              const name = s.name || "Unknown";
              serviceStats[name] = (serviceStats[name] || 0) + (s.price || 0);
            });

            const total = Object.values(serviceStats).reduce((a, b) => a + b, 0) || 1;
            const topServicesList = Object.entries(serviceStats)
              .map(([name, r]) => ({
                name,
                percentage: Math.round((r / total) * 100),
              }))
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5);

            setTopServices(topServicesList);
          }
        } catch (e) {
          console.error("Services failed:", e);
        }
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        
        // Extract error details
        const errorMessage = err?.message || "Unknown error";
        const statusCode = err?.status || err?.response?.status || 500;
        const responseData = err?.response?.data || err?.data;
        
        console.error("Error details:", {
          message: errorMessage,
          status: statusCode,
          response: responseData,
        });
        
        if (statusCode === 401 || errorMessage.includes("401")) {
          setError("Session expired. Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => router.push("/login?redirect=/laundry-admin"), 1500);
          return;
        } else {
          // For 500 or any other error, ensure we show empty state instead of mock data
          console.log("Failed to fetch dashboard data. Showing empty state.");
          setStats({ totalRevenue: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0 });
          setRecentOrders([]);
          setTopServices([]);
          
          // Show backend error details if available
          const backendError = responseData?.error || responseData?.message || errorMessage;
          
          if (statusCode === 500) {
            setError(`Backend Error (500): ${backendError}. Using demo data.`);
          } else if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
            setError("Offline mode: Using demo data.");
          } else {
            setError(`Error (${statusCode}): ${backendError}. Using demo data.`);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return `EGP ${value.toLocaleString()}`;
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "ready":
        return "bg-purple-100 text-purple-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f4c5c]/5 to-[#2a9d8f]/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0f4c5c] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f4c5c]/5 to-[#2a9d8f]/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, here&apos;s what&apos;s happening</p>
          {error && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">{error}</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Backend: https://ndeefapp.runasp.net
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔄 Retry
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log("🔍 Testing API...");
                          const res = await fetch("/api/backend/laundry-admin/dashboard");
                          const text = await res.text();
                          console.log("Response:", res.status, text);
                          alert(`Status: ${res.status}\n\n${text.substring(0, 500)}`);
                        } catch (e: any) {
                          console.error("Test failed:", e);
                          alert(`Error: ${e.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔍 Debug API
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="Live backend data"
            trend="up"
            accent
            delay={0}
          />
          <StatCard
            icon={Package}
            label="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            subtitle="Across your laundry"
            trend="up"
            delay={0.1}
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Orders"
            value={stats.completedOrders.toLocaleString()}
            subtitle="Successfully delivered"
            trend="neutral"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={stats.pendingOrders.toLocaleString()}
            subtitle="Needs attention"
            trend="down"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500">Latest 6 orders from backend</p>
              </div>
              <button
                onClick={() => router.push("/laundry-admin/orders")}
                className="flex items-center gap-2 text-[#0f4c5c] hover:text-[#2a9d8f] transition-colors text-sm font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f4c5c] to-[#2a9d8f] flex items-center justify-center text-white font-bold">
                        {order.id?.slice(-2) || index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">
                          • {order.customerName} • {order.serviceName} • {order.items} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${order.total}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{order.time}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">No recent orders found</div>
              )}
            </div>
          </motion.div>

          {/* Top Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Services</h2>
            <p className="text-sm text-gray-500 mb-4">By revenue this month</p>

            <div className="space-y-4">
              {topServices.length > 0 ? (
                topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f4c5c] to-[#2a9d8f] flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        <span className="text-sm font-bold text-[#0f4c5c]">
                          {service.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${service.percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-[#0f4c5c] to-[#2a9d8f] rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">No services data</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
