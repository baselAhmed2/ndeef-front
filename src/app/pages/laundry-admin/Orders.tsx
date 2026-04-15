"use client";

import { useState, useEffect } from "react";
import { getIncomingOrders } from "@/app/lib/laundry-admin-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  Package,
  XCircle,
  Download,
  SlidersHorizontal,
  CheckCheck,
  X,
  Info,
} from "lucide-react";

type OrderStatus = "All" | "Pending" | "Processing" | "Ready" | "Delivered" | "Cancelled";

interface Order {
  id: string;
  customer: string;
  phone: string;
  service: string;
  items: number;
  amount: number;
  status: Exclude<OrderStatus, "All">;
  date: string;
  address: string;
}

const defaultAllOrders: Order[] = [
  { id: "ORD-1024", customer: "Sarah Johnson", phone: "+1 555-0101", service: "Wash & Fold", items: 3, amount: 45.0, status: "Delivered", date: "Apr 7, 2026", address: "123 Oak St" },
  { id: "ORD-1023", customer: "Mohammed Al-Rashid", phone: "+966 555-0102", service: "Dry Cleaning", items: 5, amount: 120.0, status: "Ready", date: "Apr 7, 2026", address: "45 Palm Ave" },
  { id: "ORD-1022", customer: "Emily Chen", phone: "+1 555-0103", service: "Ironing", items: 8, amount: 32.0, status: "Processing", date: "Apr 7, 2026", address: "78 Maple Dr" },
  { id: "ORD-1021", customer: "James Williams", phone: "+1 555-0104", service: "Wash & Fold", items: 2, amount: 28.0, status: "Pending", date: "Apr 6, 2026", address: "90 Elm Rd" },
  { id: "ORD-1020", customer: "Fatima Al-Amin", phone: "+966 555-0105", service: "Dry Cleaning", items: 4, amount: 95.0, status: "Processing", date: "Apr 6, 2026", address: "12 Rose Blvd" },
  { id: "ORD-1019", customer: "Lucas Moreira", phone: "+55 555-0106", service: "Stain Removal", items: 1, amount: 55.0, status: "Delivered", date: "Apr 6, 2026", address: "34 Cedar Ln" },
  { id: "ORD-1018", customer: "Anna Petrov", phone: "+7 555-0107", service: "Wash & Fold", items: 6, amount: 78.0, status: "Cancelled", date: "Apr 5, 2026", address: "56 Birch Way" },
  { id: "ORD-1017", customer: "Khalid Al-Omar", phone: "+966 555-0108", service: "Dry Cleaning", items: 3, amount: 85.0, status: "Delivered", date: "Apr 5, 2026", address: "11 Willow St" },
  { id: "ORD-1016", customer: "Mei Lin", phone: "+86 555-0109", service: "Ironing", items: 10, amount: 40.0, status: "Ready", date: "Apr 5, 2026", address: "29 Oak Ave" },
  { id: "ORD-1015", customer: "Carlos Gomez", phone: "+52 555-0110", service: "Stain Removal", items: 2, amount: 65.0, status: "Pending", date: "Apr 4, 2026", address: "77 Pine Rd" },
  { id: "ORD-1014", customer: "Priya Sharma", phone: "+91 555-0111", service: "Wash & Fold", items: 5, amount: 62.0, status: "Delivered", date: "Apr 4, 2026", address: "8 Lotus Dr" },
  { id: "ORD-1013", customer: "Ahmed Youssef", phone: "+20 555-0112", service: "Dry Cleaning", items: 7, amount: 175.0, status: "Processing", date: "Apr 4, 2026", address: "33 Nile Blvd" },
];

const statusConfig: Record<Exclude<OrderStatus, "All">, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  Pending: { color: "#EBA050", bg: "#fff7ed", icon: Clock, label: "Pending" },
  Processing: { color: "#1D5B70", bg: "#f0f9ff", icon: Loader2, label: "Processing" },
  Ready: { color: "#8b5cf6", bg: "#f5f3ff", icon: Package, label: "Ready" },
  Delivered: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2, label: "Delivered" },
  Cancelled: { color: "#ef4444", bg: "#fef2f2", icon: XCircle, label: "Cancelled" },
};

const tabs: OrderStatus[] = ["All", "Pending", "Processing", "Ready", "Delivered", "Cancelled"];

const ITEMS_PER_PAGE = 8;

export function Orders() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exportToast, setExportToast] = useState(false);
  const [filtersToast, setFiltersToast] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getIncomingOrders();
        if (data && Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 2500);
  };

  const handleFilters = () => {
    setFiltersToast(true);
    setTimeout(() => setFiltersToast(false), 2500);
  };

  const filtered = orders.filter((o) => {
    const matchesTab = activeTab === "All" || o.status === activeTab;
    const matchesSearch =
      search === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.service.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const countByStatus = (s: OrderStatus) =>
    s === "All" ? orders.length : orders.filter((o) => o.status === s).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-gray-900 font-semibold">All Orders</h2>
          <p className="text-gray-400 text-xs mt-0.5">{loading ? "Loading..." : `${orders.length} total orders`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handleFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#1D5B70" }}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Export Toast */}
      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-xl rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCheck className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Export Started</p>
              <p className="text-xs text-gray-400">Your CSV file is downloading...</p>
            </div>
            <button onClick={() => setExportToast(false)} className="ml-2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Toast */}
      <AnimatePresence>
        {filtersToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-blue-200 shadow-xl rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Info className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Advanced Filters</p>
              <p className="text-xs text-gray-400">Filter panel configuration loading...</p>
            </div>
            <button onClick={() => setFiltersToast(false)} className="ml-2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-50">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={activeTab === tab ? { backgroundColor: "#1D5B70" } : {}}
              >
                {tab}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {countByStatus(tab)}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search orders…"
              className="pl-9 pr-4 h-9 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 w-full sm:w-60"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {paginated.map((order, i) => {
                  const cfg = statusConfig[order.status];
                  const Icon = cfg.icon;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      onClick={() => router.push(`/laundry-admin/orders/${order.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold" style={{ color: "#1D5B70" }}>
                          {order.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{order.customer}</p>
                          <p className="text-xs text-gray-400">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div>
                          <p className="text-sm text-gray-700">{order.service}</p>
                          <p className="text-xs text-gray-400">{order.items} items</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 hidden lg:table-cell">{order.date}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">${order.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                          onClick={(e) => { e.stopPropagation(); router.push(`/laundry-admin/orders/${order.id}`); }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-10 h-10 mb-3 opacity-40 animate-spin" />
              <p className="text-sm font-medium">Loading orders...</p>
            </div>
          ) : filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Filter className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No orders found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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
      </div>
    </div>
  );
}
