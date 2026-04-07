"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Search,
  ShieldAlert,
  Store,
  XCircle,
} from "lucide-react";

import { apiRequest, ApiError } from "@/app/lib/admin-api";
import type { LaundryRecord } from "@/app/types/admin";

const statusPill = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Inactive: "bg-amber-50 text-amber-700 border-amber-100",
} as const;

const availabilityPill = {
  Open: "bg-emerald-50 text-emerald-700",
  Busy: "bg-amber-50 text-amber-700",
  Closed: "bg-slate-100 text-slate-600",
} as const;

type FilterValue = "NeedsReview" | "Approved" | "All";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function VerificationsPage() {
  const [laundries, setLaundries] = useState<LaundryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterValue>("NeedsReview");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVerifications() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiRequest<LaundryRecord[]>("/admin/laundries");
        if (!isMounted) return;

        const sorted = [...response].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setLaundries(sorted);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof ApiError ? err.message : "Failed to load verification queue.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVerifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const queue = useMemo(
    () =>
      laundries.filter((laundry) => {
        if (filter === "NeedsReview") return laundry.status === "Inactive";
        if (filter === "Approved") return laundry.status === "Active";
        return true;
      }),
    [filter, laundries],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return queue;

    return queue.filter((laundry) =>
      [laundry.name, laundry.address, laundry.availability, laundry.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [queue, search]);

  const stats = useMemo(
    () => ({
      total: laundries.length,
      pendingReview: laundries.filter((laundry) => laundry.status === "Inactive").length,
      approved: laundries.filter((laundry) => laundry.status === "Active").length,
      openedToday: laundries.filter((laundry) => laundry.availability === "Open").length,
    }),
    [laundries],
  );

  async function updateLaundryStatus(laundry: LaundryRecord, nextStatus: "Active" | "Inactive") {
    let reason: string | undefined;

    if (nextStatus === "Inactive") {
      const promptValue = window.prompt("Enter a reason for rejecting or suspending this laundry:");
      if (!promptValue) {
        return;
      }
      reason = promptValue;
    }

    setIsUpdatingId(laundry.id);
    setError(null);

    try {
      await apiRequest(`/admin/laundries/${laundry.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: nextStatus,
          reason,
        }),
      });

      setLaundries((current) =>
        current.map((item) =>
          item.id === laundry.id ? { ...item, status: nextStatus } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update laundry verification status.");
    } finally {
      setIsUpdatingId(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#2A5C66]/10 px-3 py-1 text-xs font-semibold text-[#2A5C66]">
            <ShieldAlert size={14} />
            Verification workflow
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Verifications Center</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Connected to <code className="rounded bg-slate-100 px-1">GET /api/admin/laundries</code> and{" "}
            <code className="rounded bg-slate-100 px-1">PUT /api/admin/laundries/:id/status</code>. Because the backend
            exposes only <strong>Active</strong> and <strong>Inactive</strong>, this queue treats inactive laundries as
            items waiting for manual review.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Total Laundries</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Needs Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pendingReview}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-medium text-slate-400">Open Right Now</p>
          <p className="mt-1 text-2xl font-bold text-[#2A5C66]">{stats.openedToday}</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            {([
              ["NeedsReview", "Needs Review"],
              ["Approved", "Approved"],
              ["All", "All Laundries"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === value ? "bg-[#2A5C66] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by laundry or address..."
              className="w-full lg:w-72 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm text-slate-700 focus:border-[#2A5C66]/40 focus:ring-2 focus:ring-[#2A5C66]/10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
            <LoaderCircle size={18} className="mr-2 animate-spin" />
            Loading verification queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <BadgeCheck size={28} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">No laundries in this queue</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Try a different filter or search term. When a laundry is inactive, it will appear in the review queue here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((laundry) => {
              const isPending = laundry.status === "Inactive";
              const isUpdating = isUpdatingId === laundry.id;

              return (
                <div
                  key={laundry.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#2A5C66]/10 text-[#2A5C66]">
                        {laundry.imageUrl ? (
                          <img src={laundry.imageUrl} alt={laundry.name} className="h-full w-full object-cover" />
                        ) : (
                          <Store size={22} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-slate-900">{laundry.name}</h2>
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold",
                              statusPill[laundry.status],
                            )}
                          >
                            {isPending ? <Clock3 size={12} /> : <CheckCircle2 size={12} />}
                            {isPending ? "Needs review" : "Approved"}
                          </span>
                          <span
                            className={clsx(
                              "rounded-full px-2 py-1 text-[11px] font-semibold",
                              availabilityPill[laundry.availability],
                            )}
                          >
                            {laundry.availability}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500">
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-300" />
                            {laundry.address}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <CalendarClock size={13} className="text-slate-300" />
                            Registered {formatDateTime(laundry.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xl:min-w-[360px]">
                      <div className="rounded-xl bg-white px-3 py-3 border border-slate-100">
                        <p className="text-[11px] font-medium text-slate-400">Rating</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">{laundry.averageRating.toFixed(1)}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3 border border-slate-100">
                        <p className="text-[11px] font-medium text-slate-400">Joined</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">{formatDate(laundry.createdAt)}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3 border border-slate-100 col-span-2 sm:col-span-1">
                        <p className="text-[11px] font-medium text-slate-400">Backend ID</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">#{laundry.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateLaundryStatus(laundry, "Active")}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-70"
                    >
                      {isUpdating ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      {isPending ? "Approve Laundry" : "Keep Approved"}
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateLaundryStatus(laundry, "Inactive")}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-70"
                    >
                      {isUpdating ? <LoaderCircle size={15} className="animate-spin" /> : <XCircle size={15} />}
                      {isPending ? "Reject For Now" : "Suspend Laundry"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
