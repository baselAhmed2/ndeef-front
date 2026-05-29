import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRoutePath } from "@/app/lib/platform";
import { Package, ChevronRight, Clock, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ApiError,
  UiOrder,
  getOrdersRequest,
  mapOrderDtoToUiOrder,
  statusConfig,
  statusOrder,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";

function normalizeRole(role?: string | null) {
  return (role ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function getRoleHome(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole.includes("laundryadmin")) return "/laundry-admin";
  if (normalizedRole.includes("courier")) return "/courier";
  if (normalizedRole.includes("superadmin") || normalizedRole.includes("admin")) return "/admin";

  return "/";
}

function progressPercent(status: UiOrder["status"]) {
  if (status === "cancelled") return 0;
  const idx = statusOrder.indexOf(status);
  return Math.round(((idx + 1) / statusOrder.length) * 100);
}

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

function OrderCard({ order }: { order: UiOrder }) {
  const cfg = statusConfig[order.status];
  const progress = progressPercent(order.status);
  const isActive = order.status !== "delivered" && order.status !== "cancelled";

  return (
    <motion.div variants={itemVariants}>
      <Link href={getRoutePath("/track-order", String(order.id))} className="block">
        <motion.div
          whileHover={{ y: -6, boxShadow: "0 18px 40px rgba(15,23,42,0.10)" }}
          whileTap={{ scale: 0.992 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="ndeef-page-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md active:scale-[0.99] transition-all"
        >
          <div className="px-5 py-4 border-b border-gray-50">
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{order.laundryName}</p>
                <p className="mt-0.5 text-xs text-gray-400">{order.serviceName}</p>
                {order.bundleMetadata && (
                  <p className="mt-1 text-[11px] font-medium text-[#1D6076]">
                    Bundle: {order.bundleMetadata.bundleName}
                  </p>
                )}
              </div>
              <span
                className="ml-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Package size={11} className="text-[#1D6076]" strokeWidth={2.5} />
                <span>
                  {order.itemCount} {order.serviceUnit}
                </span>
              </div>
              <span className="text-gray-200">Â·</span>
              <div className="flex items-center gap-1">
                <Clock size={11} className="text-[#EBA050]" strokeWidth={2.5} />
                <span>
                  {order.pickupDate}, {order.pickupTime}
                </span>
              </div>
              <span className="text-gray-200">Â·</span>
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-gray-400" strokeWidth={2.5} />
                <span className="max-w-[90px] truncate">{order.pickupAddress.split(",")[0]}</span>
              </div>
            </div>
          </div>

          {isActive && (
            <div className="ndeef-page-soft border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-gray-500">Order progress</span>
                <span className="text-xs font-medium" style={{ color: cfg.color }}>
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full transition-all duration-500"
                  style={{ backgroundColor: cfg.color }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-base font-semibold text-[#1D6076]">{order.total} EGP</span>
            <motion.div whileHover={{ x: 2 }}>
              <ChevronRight size={16} className="text-gray-300" strokeWidth={2} />
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function Orders() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, user, logout } = useAuth();
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [loading, setLoading] = useState(true);
  const normalizedRole = normalizeRole(user?.role);
  const isCustomer = normalizedRole === "customer";

  const loadOrders = async (silent = false) => {
    if (!user?.token || !isCustomer) {
      if (!silent) {
        setOrders([]);
        setLoading(false);
      }
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await getOrdersRequest(user.token);
      setOrders(response.data.map(mapOrderDtoToUiOrder));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setOrders([]);

        if (error.status === 401) {
          logout();
          toast.error("Your session expired. Please sign in again.");
          router.replace("/login?from=%2Forders");
          return;
        }

        toast.error("This page is available for customer accounts only.");
        router.replace(getRoleHome(user?.role));
        return;
      }

      setOrders([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=%2Forders");
      return;
    }

    if (!isCustomer) {
      router.replace(getRoleHome(user?.role));
    }
  }, [isAuthReady, isCustomer, isLoggedIn, router, user?.role]);

  useEffect(() => {
    if (isAuthReady && isLoggedIn && isCustomer) {
      void loadOrders();
    }
  }, [isAuthReady, isCustomer, isLoggedIn, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useAutoRefresh(() => {
    if (!isAuthReady || !isLoggedIn || !isCustomer) return;
    return loadOrders(true);
  }, { enabled: isAuthReady && isLoggedIn && isCustomer, intervalMs: 10000 });

  useEffect(() => {
    const notice = searchParams?.get("notice");
    if (!notice) return;

    if (notice === "cancelled") toast.success("Order cancelled successfully.");
    if (notice === "placed") toast.success("Order placed successfully.");
    router.replace("/orders");
  }, [router, searchParams]);

  const active = useMemo(
    () => orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled"),
    [orders],
  );
  const completed = useMemo(
    () => orders.filter((order) => order.status === "delivered" || order.status === "cancelled"),
    [orders],
  );
  const display = activeTab === "active" ? active : completed;

  if (!isAuthReady || !isLoggedIn || !isCustomer) return null;

  return (
    <div className="ndeef-page-shell min-h-screen bg-[#f5f5f5] pb-24" dir="ltr">
      <div className="border-b border-gray-100 bg-white px-4 py-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl"
        >
          <h1 className="text-lg text-gray-900">My Orders</h1>
          <p className="mt-0.5 text-xs text-gray-400">{orders.length} total orders</p>

          <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/90 p-1.5">
            <div className="grid grid-cols-2 gap-2">
              {(["active", "completed"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-xl py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white text-[#1D6076] shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                      : "text-gray-600 hover:bg-white/70 hover:text-gray-800"
                  }`}
                >
                  {tab === "active" ? `Active (${active.length})` : `Completed (${completed.length})`}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0.4, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1D6076]/10"
            >
              <Package size={26} className="text-[#1D6076]" strokeWidth={1.5} />
            </motion.div>
            <p className="text-sm text-gray-500">Loading orders from the backend...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1D6076]/10 to-[#EBA050]/10"
            >
              <Package size={48} className="text-[#1D6076]" strokeWidth={1.2} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-2 text-2xl font-semibold text-gray-900"
            >
              No Orders Yet
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 max-w-sm text-center text-base text-gray-500"
            >
              Your account is connected to the backend, but there are no customer orders yet.
            </motion.p>
            <Link
              href="/nearby"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1D6076] px-8 py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#2a7a94] active:scale-[0.98]"
            >
              <MapPin size={16} strokeWidth={2.5} />
              Find Nearby Laundries
            </Link>
          </div>
        ) : display.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package size={26} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="mb-1 text-base text-gray-500">No {activeTab} orders</p>
            {activeTab === "active" && (
              <Link href="/nearby" className="mt-2 text-sm text-[#1D6076] underline">
                Find Nearby Laundries
              </Link>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 12 }}
              className="space-y-3"
            >
              {display.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
