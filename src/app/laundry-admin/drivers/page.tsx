"use client";

import { useEffect, useState } from "react";
import {
  assignCourier,
  getLaundryCouriers,
  type LaundryCourierDTO,
  unassignCourier,
} from "@/app/lib/laundry-admin-client";
import {
  CheckCircle2,
  Loader2,
  Phone,
  RefreshCw,
  Truck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { usePreferences } from "@/app/context/PreferencesContext";

function StatCard({
  label,
  value,
  tone,
  isDark,
}: {
  label: string;
  value: string | number;
  tone: "blue" | "green" | "orange" | "red";
  isDark: boolean;
}) {
  const tones = {
    blue: isDark ? "bg-[#1D5B70]/20 text-[#8dd0e6]" : "bg-[#1D5B70]/10 text-[#1D5B70]",
    green: isDark ? "bg-green-500/15 text-green-300" : "bg-green-50 text-green-700",
    orange: isDark ? "bg-orange-500/15 text-orange-300" : "bg-orange-50 text-orange-700",
    red: isDark ? "bg-red-500/15 text-red-300" : "bg-red-50 text-red-700",
  };

  return (
    <div
      className={`rounded-2xl p-5 ${
        isDark
          ? "border border-white/10 bg-[#102231] shadow-none"
          : "border border-gray-100 bg-white shadow-sm"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`mt-3 inline-flex rounded-xl px-3 py-2 text-2xl font-black ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}

export default function LaundryDriversPage() {
  const { isDark } = usePreferences();
  const [couriers, setCouriers] = useState<LaundryCourierDTO[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCouriers = async () => {
    try {
      setLoading(true);
      setError("");
      setCouriers(await getLaundryCouriers());
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not load couriers.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  useAutoRefresh(() => {
    if (saving) return;
    return loadCouriers();
  }, { intervalMs: 10000 });

  const handleAssign = async () => {
    if (!phoneNumber.trim()) {
      setError("Enter the courier phone number first.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await assignCourier(phoneNumber);
      setPhoneNumber("");
      setMessage("Courier assigned successfully.");
      await loadCouriers();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not assign courier.";
      setError(text);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (courierId: string) => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await unassignCourier(courierId);
      setMessage("Courier unassigned successfully.");
      await loadCouriers();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not unassign courier.";
      setError(text);
    } finally {
      setSaving(false);
    }
  };

  const availableCount = couriers.filter((courier) => courier.isAvailable).length;
  const completedOrders = couriers.reduce(
    (sum, courier) => sum + courier.completedOrdersCount,
    0,
  );
  const cancellationCount = couriers.reduce(
    (sum, courier) => sum + courier.cancellationCount,
    0,
  );
  const pageClass = isDark
    ? "min-h-full bg-[#071923] p-6"
    : "min-h-full bg-gradient-to-br from-[#f7fbfc] via-white to-[#fff7ed] p-6";
  const heroClass = isDark
    ? "rounded-[2rem] border border-white/10 bg-[#102231] p-6 shadow-none"
    : "rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-[#1D5B70]/5";
  const sectionClass = isDark
    ? "rounded-[2rem] border border-white/10 bg-[#102231] p-6 shadow-none"
    : "rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm";
  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className={heroClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#EBA050]">
                Delivery Team
              </p>
              <h1 className={`mt-2 text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-950"}`}>
                Courier Operations
              </h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${isDark ? "text-[#8db7cb]" : "text-gray-500"}`}>
                Assign existing courier accounts to this laundry by phone number and keep the
                active delivery team up to date.
              </p>
            </div>
            <button
              onClick={loadCouriers}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${isDark ? "border border-white/10 bg-[#132a3a] text-white hover:border-[#1D5B70]/50 hover:text-[#8dd0e6]" : "border border-gray-200 bg-white text-gray-700 hover:border-[#1D5B70]/40 hover:text-[#1D5B70]"}`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned Couriers" value={couriers.length} tone="blue" isDark={isDark} />
          <StatCard label="Available Now" value={availableCount} tone="green" isDark={isDark} />
          <StatCard label="Completed Orders" value={completedOrders} tone="orange" isDark={isDark} />
          <StatCard label="Cancellations" value={cancellationCount} tone="red" isDark={isDark} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <section className={sectionClass}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1D5B70]/10 text-[#1D5B70]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className={`font-bold ${isDark ? "text-white" : "text-gray-950"}`}>Assign Courier</h2>
                <p className={`text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>Search by courier phone number</p>
              </div>
            </div>

            <label className={`mb-2 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#8db7cb]" : "text-gray-500"}`}>
              Courier Phone Number
            </label>
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`} />
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="01012345678"
                className={`h-12 w-full rounded-2xl pl-10 pr-3 text-sm outline-none transition focus:border-[#1D5B70] focus:ring-4 focus:ring-[#1D5B70]/10 ${isDark ? "border border-white/10 bg-[#132a3a] text-white placeholder:text-[#8db7cb] focus:bg-[#193447]" : "border border-gray-200 bg-gray-50 focus:bg-white"}`}
              />
            </div>
            <button
              onClick={handleAssign}
              disabled={saving}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D5B70] text-sm font-bold text-white transition hover:bg-[#17495a] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Assign Courier
            </button>

            {message && (
              <div
                className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                  isDark
                    ? "border border-green-500/30 bg-green-500/10 text-green-200"
                    : "border border-green-100 bg-green-50 text-green-700"
                }`}
              >
                {message}
              </div>
            )}
            {error && (
              <div
                className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                  isDark
                    ? "border border-red-500/30 bg-red-500/10 text-red-200"
                    : "border border-red-100 bg-red-50 text-red-700"
                }`}
              >
                {error}
              </div>
            )}
          </section>

          <section className={sectionClass}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className={`font-bold ${isDark ? "text-white" : "text-gray-950"}`}>Assigned Couriers</h2>
                <p className={`text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>Live from /laundry-admin/couriers</p>
              </div>
              <Truck className="h-5 w-5 text-[#EBA050]" />
            </div>

            {loading ? (
              <div className={`flex h-56 items-center justify-center ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading couriers...
              </div>
            ) : couriers.length === 0 ? (
              <div className={`flex h-56 flex-col items-center justify-center rounded-3xl border text-center ${isDark ? "border-dashed border-white/10 bg-[#132a3a]" : "border-dashed border-gray-200 bg-gray-50"}`}>
                <Truck className={`h-10 w-10 ${isDark ? "text-[#8db7cb]" : "text-gray-300"}`} />
                <p className={`mt-3 text-sm font-semibold ${isDark ? "text-white" : "text-gray-600"}`}>No couriers assigned yet</p>
                <p className={`mt-1 text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>
                  Add a courier by phone number when they are registered as a courier.
                </p>
              </div>
            ) : (
              <div className={`${isDark ? "overflow-hidden rounded-3xl border border-white/10" : "overflow-hidden rounded-3xl border border-gray-100"}`}>
                <div className={`grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.7fr] px-4 py-3 text-xs font-bold uppercase tracking-wide ${isDark ? "bg-[#132a3a] text-[#8db7cb]" : "bg-gray-50 text-gray-400"}`}>
                  <span>Courier</span>
                  <span>Phone</span>
                  <span>Status</span>
                  <span>Done</span>
                  <span className="text-right">Action</span>
                </div>
                {couriers.map((courier) => (
                  <div
                    key={courier.courierId}
                    className={`grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.7fr] items-center px-4 py-4 text-sm ${isDark ? "border-t border-white/10" : "border-t border-gray-100"}`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate font-semibold ${isDark ? "text-white" : "text-gray-950"}`}>{courier.name || "Courier"}</p>
                      <p className={`truncate text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>{courier.courierId}</p>
                    </div>
                    <span className={isDark ? "text-[#c9e0ea]" : "text-gray-600"}>{courier.phoneNumber || "N/A"}</span>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        courier.isAvailable
                          ? "bg-green-50 text-green-700"
                          : isDark ? "bg-white/10 text-[#8db7cb]" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {courier.isAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {courier.isAvailable ? "Available" : "Offline"}
                    </span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-gray-700"}`}>{courier.completedOrdersCount}</span>
                    <button
                      onClick={() => handleUnassign(courier.courierId)}
                      disabled={saving}
                      className="justify-self-end rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Unassign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
