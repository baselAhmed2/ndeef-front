"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  ChevronRight,
  Package,
  Shirt,
  Wind,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Search,
  ArrowRight,
  CreditCard,
  Banknote,
  Loader2,
} from "lucide-react";
import {
  type CourierDashboardOrder,
  getAllCourierOrders,
  getCourierActiveRun,
  getCourierTodayStats,
  serviceIconKey,
} from "@/app/lib/courier-client";
import { ApiError } from "@/app/lib/admin-api";

type Tab = "new" | "active" | "done";

const STATUS_META = {
  pending: { label: "New Order", color: "#EBA050", bg: "#fff7ed", icon: AlertTriangle },
  accepted: { label: "Accepted", color: "#2563eb", bg: "#eff6ff", icon: CheckCircle2 },
  picked_up: { label: "In Transit", color: "#7c3aed", bg: "#f5f3ff", icon: Truck },
  delivered: { label: "Delivered", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
};

const AVATAR_BG = ["#1D5B70", "#EBA050", "#7c3aed", "#0891b2", "#059669", "#dc2626"];

const TABS: { id: Tab; label: string; sublabel: string }[] = [
  { id: "new", label: "New Orders", sublabel: "Waiting for you to accept" },
  { id: "active", label: "In Progress", sublabel: "Accepted or picked up" },
  { id: "done", label: "Completed Today", sublabel: "Delivered orders" },
];

function getServiceIcon(service: string) {
  switch (serviceIconKey(service)) {
    case "wash":
      return Droplets;
    case "dry":
      return Wind;
    case "iron":
      return Shirt;
    default:
      return Package;
  }
}

function PaymentBadge({ paid, amount, size = "sm" }: { paid: boolean; amount: number; size?: "sm" | "md" }) {
  if (paid) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-lg ${
          size === "md" ? "px-2.5 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]"
        } bg-green-50 text-green-700 border border-green-200`}
      >
        <CreditCard className={size === "md" ? "w-3.5 h-3.5" : "w-3 h-3"} />
        Paid online
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg ${
        size === "md" ? "px-2.5 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]"
      } bg-amber-50 text-amber-700 border border-amber-300`}
    >
      <Banknote className={size === "md" ? "w-3.5 h-3.5" : "w-3 h-3"} />
      Collect EGP {amount}
    </span>
  );
}

function QuickStats({
  todaysOrders,
  inTransit,
  earnedToday,
  vsYesterdayPercentage,
}: {
  todaysOrders: number;
  inTransit: number;
  earnedToday: number;
  vsYesterdayPercentage: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        {
          label: "Today's Orders",
          value: String(todaysOrders),
          sub: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
          color: "#1D5B70",
        },
        {
          label: "In Transit",
          value: String(inTransit),
          sub: inTransit === 1 ? "1 delivery active" : `${inTransit} deliveries active`,
          color: "#7c3aed",
        },
        {
          label: "Earned Today",
          value: `EGP ${earnedToday.toFixed(0)}`,
          sub: `${vsYesterdayPercentage >= 0 ? "+" : ""}${vsYesterdayPercentage.toFixed(0)}% vs yesterday`,
          color: "#16a34a",
        },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">{s.label}</p>
          <p className="font-bold text-gray-900" style={{ fontSize: "1.1rem" }}>
            {s.value}
          </p>
          <p className="text-[11px] mt-1" style={{ color: s.color }}>
            {s.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, index, onClick }: { order: CourierDashboardOrder; index: number; onClick: () => void }) {
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;
  const ServiceIcon = getServiceIcon(order.service);
  const avatarBg = AVATAR_BG[index % AVATAR_BG.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group overflow-hidden"
    >
      {!order.paid && <div className="h-1 w-full" style={{ backgroundColor: "#EBA050" }} />}
      {order.paid && order.urgent && <div className="h-1 w-full" style={{ backgroundColor: "#ef4444" }} />}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {order.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900">{order.customer}</p>
                {order.urgent && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 uppercase tracking-wide">
                    Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{order.time}</p>
            </div>
          </div>
          <span
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            <StatusIcon className="w-3 h-3" />
            {meta.label}
          </span>
        </div>

        <div className="flex items-stretch gap-3 mb-3">
          <div className="flex flex-col items-center gap-0.5 pt-1">
            <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ borderColor: "#1D5B70" }} />
            <div className="w-px flex-1 my-0.5" style={{ backgroundColor: "#cbd5e1" }} />
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#EBA050" }} />
          </div>
          <div className="flex flex-col justify-between flex-1 bg-gray-50 rounded-xl p-3 gap-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Pick up from</p>
              <p className="text-sm font-bold text-gray-800">{order.pickupArea}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Deliver to</p>
              <p className="text-sm font-bold text-gray-800">{order.dropArea}</p>
            </div>
          </div>
        </div>

        {!order.paid && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
            <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-700 flex-1">
              Collect <span className="text-amber-900">EGP {order.amount}</span> in cash upon delivery
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ServiceIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{order.service}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{order.distance}</span>
            </div>
            {order.eta !== "—" && (
              <>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{order.eta}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PaymentBadge paid={order.paid} amount={order.amount} />
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: "#1D5B70" }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CourierOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get("tab");
  const initialTab: Tab =
    initialTabParam === "active" || initialTabParam === "done" || initialTabParam === "new"
      ? initialTabParam
      : "new";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<CourierDashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayStats, setTodayStats] = useState({
    todaysOrders: 0,
    inTransit: 0,
    earnedToday: 0,
    vsYesterdayPercentage: 0,
  });
  const [activeRunSummary, setActiveRunSummary] = useState<{
    totalStops: number;
    stopsDone: number;
    totalAmount: number;
    totalDistance: string;
  } | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    const tab = searchParams.get("tab");
    if (tab === "new" || tab === "active" || tab === "done") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [ordersResult, statsResult, activeRunResult] = await Promise.allSettled([
          getAllCourierOrders(),
          getCourierTodayStats(),
          getCourierActiveRun(),
        ]);

        if (ignore) return;

        if (ordersResult.status === "fulfilled") {
          setOrders(ordersResult.value);
        } else {
          throw ordersResult.reason;
        }

        if (statsResult.status === "fulfilled") {
          setTodayStats(statsResult.value);
        }

        setActiveRunSummary(
          activeRunResult.status === "fulfilled"
            ? activeRunResult.value
            ? {
                totalStops: activeRunResult.value.totalStops,
                stopsDone: activeRunResult.value.stopsDone,
                totalAmount: activeRunResult.value.totalAmount,
                totalDistance: activeRunResult.value.totalDistance,
              }
            : null
            : null,
        );
      } catch (loadError) {
        if (ignore) return;
        const message =
          loadError instanceof ApiError ? loadError.message : "Unable to load courier dashboard.";
        setError(message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      new: orders.filter((o) => o.status === "pending").length,
      active: orders.filter((o) => o.status === "accepted" || o.status === "picked_up").length,
      done: orders.filter((o) => o.status === "delivered").length,
    }),
    [orders],
  );

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const tabMatch =
          activeTab === "new"
            ? o.status === "pending"
            : activeTab === "active"
              ? o.status === "accepted" || o.status === "picked_up"
              : o.status === "delivered";
        const searchMatch =
          !search ||
          o.customer.toLowerCase().includes(search.toLowerCase()) ||
          o.pickupArea.toLowerCase().includes(search.toLowerCase()) ||
          o.dropArea.toLowerCase().includes(search.toLowerCase());
        return tabMatch && searchMatch;
      }),
    [activeTab, orders, search],
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="hidden lg:block">
        <QuickStats {...todayStats} />
      </div>

      {activeRunSummary && (
        <button
          onClick={() => router.push("/courier/active")}
          className="w-full flex items-center justify-between p-4 rounded-2xl mb-4 text-white text-left group hover:opacity-95 transition-all shadow-lg"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Active run — {activeRunSummary.totalStops} stops in progress
              </p>
              <p className="text-white/70 text-xs">
                {activeRunSummary.stopsDone} of {activeRunSummary.totalStops} delivered · EGP{" "}
                {activeRunSummary.totalAmount} total · {activeRunSummary.totalDistance}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:gap-2 transition-all">
            View <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or area..."
          className="w-full pl-10 pr-4 h-11 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/10 transition-all"
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count = counts[tab.id];
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                active ? "text-white shadow-sm" : "text-gray-500 bg-white border border-gray-100"
              }`}
              style={active ? { backgroundColor: "#1D5B70" } : {}}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                    active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mb-3 px-1">{TABS.find((t) => t.id === activeTab)?.sublabel}</p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1D5B70]" />
          <p className="text-sm text-gray-500 mt-3">Loading your courier orders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#f0fdf4" }}
                >
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-700 font-bold">All clear here!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab === "new"
                    ? "No new orders waiting right now."
                    : activeTab === "active"
                      ? "No orders in progress right now."
                      : "No completed orders yet."}
                </p>
              </motion.div>
            ) : (
              filtered.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  onClick={() => router.push(`/courier/order/${order.id}`)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
