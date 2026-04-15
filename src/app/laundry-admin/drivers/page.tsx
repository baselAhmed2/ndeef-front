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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "blue" | "green" | "orange" | "red";
}) {
  const tones = {
    blue: "bg-[#1D5B70]/10 text-[#1D5B70]",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-3 inline-flex rounded-xl px-3 py-2 text-2xl font-black ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}

export default function LaundryDriversPage() {
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

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f7fbfc] via-white to-[#fff7ed] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-[#1D5B70]/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#EBA050]">
                Delivery Team
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                Courier Operations
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Assign existing courier accounts to this laundry by phone number and keep the
                active delivery team synced with the backend.
              </p>
            </div>
            <button
              onClick={loadCouriers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#1D5B70]/40 hover:text-[#1D5B70] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned Couriers" value={couriers.length} tone="blue" />
          <StatCard label="Available Now" value={availableCount} tone="green" />
          <StatCard label="Completed Orders" value={completedOrders} tone="orange" />
          <StatCard label="Cancellations" value={cancellationCount} tone="red" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1D5B70]/10 text-[#1D5B70]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-950">Assign Courier</h2>
                <p className="text-xs text-gray-400">Uses backend phone lookup</p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Courier Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="01012345678"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#1D5B70] focus:bg-white focus:ring-4 focus:ring-[#1D5B70]/10"
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
              <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-950">Assigned Couriers</h2>
                <p className="text-xs text-gray-400">Live from /laundry-admin/couriers</p>
              </div>
              <Truck className="h-5 w-5 text-[#EBA050]" />
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-gray-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading couriers...
              </div>
            ) : couriers.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 text-center">
                <Truck className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-semibold text-gray-600">No couriers assigned yet</p>
                <p className="mt-1 text-xs text-gray-400">
                  Add a courier by phone number when they are registered as a courier.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-gray-100">
                <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.7fr] bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                  <span>Courier</span>
                  <span>Phone</span>
                  <span>Status</span>
                  <span>Done</span>
                  <span className="text-right">Action</span>
                </div>
                {couriers.map((courier) => (
                  <div
                    key={courier.courierId}
                    className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.7fr] items-center border-t border-gray-100 px-4 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-950">{courier.name || "Courier"}</p>
                      <p className="truncate text-xs text-gray-400">{courier.courierId}</p>
                    </div>
                    <span className="text-gray-600">{courier.phoneNumber || "N/A"}</span>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        courier.isAvailable
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {courier.isAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {courier.isAvailable ? "Available" : "Offline"}
                    </span>
                    <span className="font-semibold text-gray-700">{courier.completedOrdersCount}</span>
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
