import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, ChevronRight, Clock, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  UiOrder,
  getOrdersRequest,
  mapOrderDtoToUiOrder,
  statusConfig,
  statusOrder,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

function progressPercent(status: UiOrder["status"]) {
  if (status === "cancelled") return 0;
  const idx = statusOrder.indexOf(status);
  return Math.round(((idx + 1) / statusOrder.length) * 100);
}

function OrderCard({ order }: { order: UiOrder }) {
  const cfg = statusConfig[order.status];
  const progress = progressPercent(order.status);
  const isActive = order.status !== "delivered" && order.status !== "cancelled";

  return (
    <Link href={`/track-order/${order.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md active:scale-[0.99] transition-all">
        <div className="px-5 py-4 border-b border-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">
                {order.laundryName}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{order.serviceName}</p>
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full ml-2 shrink-0"
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
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-[#EBA050]" strokeWidth={2.5} />
              <span>
                {order.pickupDate}, {order.pickupTime}
              </span>
            </div>
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-gray-400" strokeWidth={2.5} />
              <span className="truncate max-w-[90px]">
                {order.pickupAddress.split(",")[0]}
              </span>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500">Order progress</span>
              <span className="text-xs font-medium" style={{ color: cfg.color }}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: cfg.color }}
              />
            </div>
          </div>
        )}

        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="text-[#1D6076] font-semibold text-base">
            {order.total} EGP
          </span>
          <ChevronRight size={16} className="text-gray-300" strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

export default function Orders() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isAuthReady, user } = useAuth();
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=%2Forders");
    }
  }, [isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const response = await getOrdersRequest(user.token);
        setOrders(response.data.map(mapOrderDtoToUiOrder));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthReady && isLoggedIn) {
      loadOrders();
    }
  }, [isAuthReady, isLoggedIn, user?.token]);

  useEffect(() => {
    const notice = searchParams.get("notice");
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

  if (!isAuthReady || !isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24" dir="ltr">
      <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-gray-900 text-lg">My Orders</h1>
          <p className="text-gray-400 text-xs mt-0.5">{orders.length} total orders</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3 sticky top-[129px] z-10">
        <div className="max-w-2xl mx-auto flex gap-2 bg-gray-50 rounded-xl p-1">
          {(["active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#1D6076] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab === "active"
                ? `Active (${active.length})`
                : `Completed (${completed.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <motion.div
              initial={{ opacity: 0.4, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
              className="w-16 h-16 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-4"
            >
              <Package size={26} className="text-[#1D6076]" strokeWidth={1.5} />
            </motion.div>
            <p className="text-gray-500 text-sm">Loading orders from the backend...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1D6076]/10 to-[#EBA050]/10 flex items-center justify-center mb-6"
            >
              <Package size={48} className="text-[#1D6076]" strokeWidth={1.2} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-900 text-2xl font-semibold mb-2"
            >
              No Orders Yet
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-500 text-base mb-8 max-w-sm text-center"
            >
              Your account is connected to the backend, but there are no customer orders yet.
            </motion.p>
            <Link
              href="/nearby"
              className="inline-flex items-center gap-2 bg-[#1D6076] text-white px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-[#2a7a94] active:scale-[0.98] transition-all shadow-md"
            >
              <MapPin size={16} strokeWidth={2.5} />
              Find Nearby Laundries
            </Link>
          </div>
        ) : display.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package size={26} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 text-base mb-1">No {activeTab} orders</p>
            {activeTab === "active" && (
              <Link href="/nearby" className="text-[#1D6076] text-sm mt-2 underline">
                Find Nearby Laundries
              </Link>
            )}
          </div>
        ) : (
          display.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
