"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Package,
  CheckCircle2,
  Truck,
  Phone,
  MapPin,
  Clock,
  Loader2,
  MessageCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Shirt,
  Wind,
  Droplets,
  AlertTriangle,
  Star,
  CreditCard,
  Banknote,
} from "lucide-react";
import {
  calculateCourierEarning,
  type CourierActiveRunResponseDto,
  type CourierActiveRunStopDto,
  deliverCourierRunStop,
  getCourierActiveRun,
  safeSyncCourierLocation,
  serviceIconKey,
} from "@/app/lib/courier-client";
import { ApiError } from "@/app/lib/admin-api";

type StopStatus = "done" | "current" | "upcoming";

type Stop = CourierActiveRunStopDto & {
  avatar: string;
  avatarColor: string;
  ServiceIcon: React.ElementType;
  status: StopStatus;
};

type CompletedRunSummary = {
  totalAmount: number;
  totalDistance: string;
  totalStops: number;
};

const PIN_POSITIONS = [
  { x: "14%", y: "55%" },
  { x: "38%", y: "38%" },
  { x: "60%", y: "50%" },
  { x: "80%", y: "30%" },
];

const AVATAR_COLORS = ["#7c3aed", "#1D5B70", "#0891b2", "#EBA050"];

function buildMapsUrl(destination: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeStops(stops: CourierActiveRunStopDto[]): Stop[] {
  return stops.map((stop, index) => ({
    ...stop,
    avatar: initials(stop.customer || "Customer"),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    ServiceIcon: getServiceIcon(stop.service),
    status:
      stop.status === "done" || stop.status === "current" || stop.status === "upcoming"
        ? stop.status
        : "upcoming",
  }));
}

function isMissingActiveRunError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.status !== 400 && error.status !== 404) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("no active run") ||
    message.includes("not found") ||
    message.includes("status 400") ||
    message.includes("status 404")
  );
}

function MultiStopMap({ stops, currentIdx }: { stops: Stop[]; currentIdx: number }) {
  const courierPos = PIN_POSITIONS[Math.max(0, Math.min(currentIdx, PIN_POSITIONS.length - 1))];
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 220, backgroundColor: "#d1e8df" }}>
      <svg width="100%" height="100%" className="absolute inset-0" style={{ opacity: 0.18 }}>
        <defs>
          <pattern id="mg" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#1D5B70" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mg)" />
      </svg>
      <svg className="absolute inset-0 w-full h-full">
        {PIN_POSITIONS.slice(0, -1).map((from, i) => {
          const to = PIN_POSITIONS[i + 1];
          const done = i < currentIdx;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={done ? "#1D5B70" : "#94a3b8"}
              strokeWidth="2.5"
              strokeDasharray={done ? "none" : "7,5"}
              opacity="0.7"
            />
          );
        })}
      </svg>
      <div
        className="absolute flex flex-col items-center"
        style={{ left: PIN_POSITIONS[0].x, top: PIN_POSITIONS[0].y, transform: "translate(-50%,-100%)" }}
      >
        <div
          className="w-7 h-7 rounded-xl border-2 border-white shadow-md flex items-center justify-center"
          style={{ backgroundColor: "#64748b" }}
        >
          <Package className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="bg-white rounded-lg px-1.5 py-0.5 mt-1 shadow text-[9px] font-bold text-gray-600 whitespace-nowrap">
          Ndeef
        </div>
      </div>
      {stops.map((stop, i) => {
        const pos = PIN_POSITIONS[Math.min(i + 1, PIN_POSITIONS.length - 1)];
        const done = stop.status === "done";
        const current = stop.status === "current";
        return (
          <div
            key={stop.orderId}
            className="absolute flex flex-col items-center"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%,-100%)" }}
          >
            <div
              className="w-7 h-7 rounded-xl border-2 border-white shadow-md flex items-center justify-center transition-all"
              style={{ backgroundColor: done ? "#16a34a" : current ? stop.avatarColor : "#cbd5e1" }}
            >
              {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] font-bold text-white">{stop.stopNum}</span>}
            </div>
            {current && (
              <div className="bg-white rounded-lg px-1.5 py-0.5 mt-1 shadow text-[9px] font-bold whitespace-nowrap" style={{ color: stop.avatarColor }}>
                {stop.area}
              </div>
            )}
          </div>
        );
      })}
      <motion.div
        className="absolute"
        animate={{ left: courierPos.x, top: courierPos.y }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ transform: "translate(-50%, calc(-50% - 36px))" }}
      >
        <div className="relative">
          <div className="absolute -inset-3 rounded-full animate-ping opacity-20" style={{ backgroundColor: "#EBA050" }} />
          <div className="w-9 h-9 rounded-xl border-2 border-white shadow-lg flex items-center justify-center" style={{ backgroundColor: "#EBA050" }}>
            <Truck className="w-4 h-4 text-white" />
          </div>
        </div>
      </motion.div>
      <div className="absolute top-3 left-3 bg-white rounded-xl shadow px-3 py-2 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5" style={{ color: "#1D5B70" }} />
        <div>
          <p className="text-[10px] text-gray-400 leading-none">Multi-stop run</p>
          <p className="text-xs font-bold text-gray-800">
            {stops.filter((s) => s.status === "done").length}/{stops.length} delivered
          </p>
        </div>
      </div>
    </div>
  );
}

function StopCard({
  stop,
  isExpanded,
  onToggle,
  onDeliver,
  delivering,
}: {
  stop: Stop;
  isExpanded: boolean;
  onToggle: () => void;
  onDeliver: () => void;
  delivering: boolean;
}) {
  const done = stop.status === "done";
  const current = stop.status === "current";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        current ? "border-2 shadow-lg" : done ? "border-gray-100 opacity-70" : "border-gray-100 bg-white"
      }`}
      style={current ? { borderColor: stop.avatarColor } : {}}
    >
      {current && (
        <div className="px-4 py-1.5 flex items-center justify-between" style={{ backgroundColor: stop.avatarColor }}>
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">Current Stop</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-semibold">{stop.etaFromNow}</span>
          </div>
        </div>
      )}
      <div className={`p-4 ${done ? "bg-gray-50" : "bg-white"}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2"
            style={{
              backgroundColor: done ? "#f0fdf4" : current ? stop.avatarColor : "#f8fafc",
              borderColor: done ? "#bbf7d0" : current ? stop.avatarColor : "#e2e8f0",
            }}
          >
            {done ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <span className="text-sm font-bold" style={{ color: current ? "white" : "#94a3b8" }}>{stop.stopNum}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-bold truncate ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>{stop.customer}</p>
              {stop.isUrgent && !done && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 uppercase shrink-0">
                  Urgent
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400 truncate">{stop.area}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-bold ${done ? "text-green-600" : "text-gray-900"}`}>{done ? "✓ " : ""}EGP {stop.amount}</span>
            {!done && (
              <button onClick={onToggle} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && !done && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="mt-3 space-y-3">
                {stop.isPaid ? (
                  <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <CreditCard className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-800">Paid online — no collection needed</p>
                      <p className="text-[10px] text-green-600">Just hand over the items and confirm delivery</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2.5">
                    <Banknote className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">
                        Collect <span className="text-base">EGP {stop.amount}</span> in cash
                      </p>
                      <p className="text-[10px] text-amber-700">Don&apos;t hand over items before collecting payment</p>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Deliver to</p>
                      <p className="text-sm font-semibold text-gray-800">{stop.address}</p>
                      <p className="text-xs text-gray-500">{stop.area}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <stop.ServiceIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">{stop.service}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">{stop.items} items</span>
                  </div>
                </div>
                {stop.note && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">{stop.note}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <a href={`tel:${stop.phone}`} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-green-50 border border-green-100 text-sm font-semibold text-green-700 hover:bg-green-100 transition-all px-4">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                  <a
                    href={stop.phone ? `sms:${stop.phone}` : undefined}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-blue-50 border border-blue-100 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all px-4"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </a>
                  <a
                    href={buildMapsUrl(stop.address || stop.area)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                    style={{ backgroundColor: "#1D5B70" }}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Navigate
                  </a>
                </div>
                {current && (
                  <button
                    onClick={onDeliver}
                    disabled={delivering}
                    className="w-full h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#16a34a" }}
                  >
                    {delivering ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {stop.isPaid
                          ? `Confirm Delivery to ${stop.customer.split(" ")[0]}`
                          : `Collected Cash & Delivered to ${stop.customer.split(" ")[0]}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RunSummaryBar({ run }: { run: CourierActiveRunResponseDto }) {
  const pct = run.totalStops > 0 ? (run.stopsDone / run.totalStops) * 100 : 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: "#1D5B70" }} />
          <span className="text-sm font-bold text-gray-800">Run Progress</span>
        </div>
        <span className="text-sm font-bold" style={{ color: "#1D5B70" }}>
          {run.stopsDone}/{run.totalStops} stops
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: "#1D5B70" }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Earned so far", value: `EGP ${run.earnedSoFar}`, color: "#16a34a" },
          { label: "Remaining value", value: `EGP ${run.remainingAmount}`, color: "#1D5B70" },
          { label: "Total run", value: run.totalDistance, color: "#6b7280" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="font-bold text-sm" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunCompleted({ onBack, totalAmount, totalDistance, totalStops }: { onBack: () => void; totalAmount: number; totalDistance: string; totalStops: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-green-200 p-6 text-center shadow-lg">
      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-green-500" />
      </div>
      <h2 className="text-gray-900 font-bold text-xl mb-1">Run Complete!</h2>
      <p className="text-gray-500 text-sm mb-4">All deliveries are complete. Great work today!</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Orders", value: String(totalStops), icon: Package, color: "#1D5B70", bg: "#f0f9ff" },
          { label: "Earned", value: `EGP ${totalAmount}`, icon: Star, color: "#EBA050", bg: "#fff7ed" },
          { label: "Distance", value: totalDistance, icon: MapPin, color: "#16a34a", bg: "#f0fdf4" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: s.bg }}>
            <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
            <p className="font-bold text-gray-900 text-sm">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="w-full h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ backgroundColor: "#1D5B70" }}>
        Back to orders <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function CourierActivePage() {
  const router = useRouter();
  const [run, setRun] = useState<CourierActiveRunResponseDto | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [completedRun, setCompletedRun] = useState<CompletedRunSummary | null>(null);
  const [expandedId, setExpandedId] = useState<string>("");
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasNoActiveRun, setHasNoActiveRun] = useState(false);

  const applyRunState = (result: CourierActiveRunResponseDto) => {
    setRun(result);
    setCompletedRun(null);
    setHasNoActiveRun(false);
    const nextStops = normalizeStops(result.stops);
    setStops(nextStops);
    setExpandedId(
      nextStops.find((stop) => stop.status === "current")?.orderId ??
        nextStops[0]?.orderId ??
        "",
    );
  };

  const clearRunState = () => {
    setRun(null);
    setStops([]);
    setExpandedId("");
  };

  const loadRun = async ({
    showLoader = false,
    afterSuccessfulDelivery = false,
    lastKnownRun,
  }: {
    showLoader?: boolean;
    afterSuccessfulDelivery?: boolean;
    lastKnownRun?: CourierActiveRunResponseDto | null;
  } = {}) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const result = await getCourierActiveRun();
      applyRunState(result);
      return result;
    } catch (loadError) {
      if (isMissingActiveRunError(loadError)) {
        clearRunState();
        setHasNoActiveRun(!afterSuccessfulDelivery);
        if (afterSuccessfulDelivery && lastKnownRun) {
          setCompletedRun({
            totalAmount: lastKnownRun.totalAmount,
            totalDistance: lastKnownRun.totalDistance,
            totalStops: lastKnownRun.totalStops,
          });
        }
        return null;
      }

      const message = loadError instanceof ApiError ? loadError.message : "Unable to load active run.";
      setError(message);
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    void (async () => {
      await loadRun({ showLoader: true });
      if (ignore) return;
    })();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void safeSyncCourierLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.heading ?? 0,
          position.coords.speed ?? 0,
        );
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const allDone = useMemo(() => stops.length > 0 && stops.every((s) => s.status === "done"), [stops]);
  const currentIdx = useMemo(() => Math.max(0, stops.findIndex((s) => s.status === "current")) + 1, [stops]);

  const handleDeliver = async (stopId: string) => {
    if (!run) return;
    const stop = stops.find((item) => item.orderId === stopId);
    if (!stop) return;

    setDeliveringId(stopId);
    setError("");
    try {
      await deliverCourierRunStop(run.runId, stopId, !stop.isPaid);
      await loadRun({
        afterSuccessfulDelivery: true,
        lastKnownRun: {
          ...run,
          stopsDone: Math.min(run.totalStops, run.stopsDone + 1),
          earnedSoFar: Number((run.earnedSoFar + calculateCourierEarning(stop.amount)).toFixed(2)),
          remainingAmount: Math.max(0, run.remainingAmount - stop.amount),
        },
      });
    } catch (deliverError) {
      if (deliverError instanceof ApiError && (deliverError.status === 400 || deliverError.status === 404)) {
        await loadRun({
          afterSuccessfulDelivery: true,
          lastKnownRun: {
            ...run,
            stopsDone: Math.min(run.totalStops, run.stopsDone + 1),
            earnedSoFar: Number((run.earnedSoFar + calculateCourierEarning(stop.amount)).toFixed(2)),
            remainingAmount: Math.max(0, run.remainingAmount - stop.amount),
          },
        });
        return;
      }

      setError(deliverError instanceof ApiError ? deliverError.message : "Unable to confirm delivery.");
    } finally {
      setDeliveringId(null);
    }
  };

  const handleToggle = (id: string) => setExpandedId((prev) => (prev === id ? "" : id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D5B70]" />
        <p className="text-sm text-gray-500 mt-3">Loading active run...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (completedRun) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 max-w-4xl mx-auto">
        <RunCompleted
          onBack={() => router.push("/courier")}
          totalAmount={completedRun.totalAmount}
          totalDistance={completedRun.totalDistance}
          totalStops={completedRun.totalStops}
        />
      </motion.div>
    );
  }

  if (hasNoActiveRun || !run || stops.length === 0) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-800">No active run right now</p>
          <p className="text-sm text-gray-400 mt-1">You do not have any delivery run in progress.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Active Delivery Run</h1>
          <p className="text-gray-400 text-sm">
            {allDone ? "All deliveries completed!" : `${run.stopsDone} of ${run.totalStops} stops done · EGP ${run.totalAmount} total`}
          </p>
        </div>
        {!allDone && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-semibold text-sm" style={{ borderColor: "#1D5B70", color: "#1D5B70", backgroundColor: "#f0f9ff" }}>
            <Layers className="w-4 h-4" />
            {run.totalStops} stops
          </div>
        )}
      </div>

      {allDone ? (
        <RunCompleted onBack={() => router.push("/courier")} totalAmount={run.earnedSoFar} totalDistance={run.totalDistance} totalStops={run.totalStops} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Route Overview</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">Live</span>
                </div>
              </div>
              <MultiStopMap stops={stops} currentIdx={currentIdx} />
            </div>
            <RunSummaryBar run={run} />
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-700">Picked up from laundry</p>
                <p className="text-xs text-green-600">
                  {run.laundryName} · {run.totalItems} items total
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Delivery Stops</p>
              <p className="text-xs text-gray-400">Tap a stop to expand</p>
            </div>
            {stops.map((stop) => (
              <StopCard
                key={stop.orderId}
                stop={stop}
                isExpanded={expandedId === stop.orderId}
                onToggle={() => handleToggle(stop.orderId)}
                onDeliver={() => handleDeliver(stop.orderId)}
                delivering={deliveringId === stop.orderId}
              />
            ))}
            {stops.find((s) => s.status === "current") && (
              <div className="lg:hidden">
                {(() => {
                  const currentStop = stops.find((s) => s.status === "current");
                  if (!currentStop || expandedId === currentStop.orderId) return null;
                  return (
                    <button
                      onClick={() => setExpandedId(currentStop.orderId)}
                      className="w-full h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ backgroundColor: currentStop.avatarColor }}
                    >
                      <Navigation className="w-4 h-4" />
                      Go to Stop {currentStop.stopNum} — {currentStop.customer.split(" ")[0]}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
