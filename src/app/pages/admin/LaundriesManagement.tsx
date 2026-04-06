import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle,
  Clock3,
  Download,
  LoaderCircle,
  MapPin,
  Search,
  Store,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { apiRequest, ApiError } from "../../lib/admin-api";
import type { LaundryRecord } from "../../types/admin";

const statusConfig = {
  Active: {
    label: "Active",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle,
  },
  Inactive: {
    label: "Inactive",
    color: "bg-red-50 text-red-700 border-red-100",
    icon: XCircle,
  },
} as const;

const availabilityConfig = {
  Open: "bg-emerald-50 text-emerald-700",
  Busy: "bg-amber-50 text-amber-700",
  Closed: "bg-slate-100 text-slate-600",
} as const;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function LaundriesManagement() {
  const [laundries, setLaundries] = useState<LaundryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLaundries() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiRequest<LaundryRecord[]>("/admin/laundries");
        if (isMounted) {
          setLaundries(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : "Failed to load laundries.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLaundries();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return laundries.filter((laundry) => {
      if (filter !== "All" && laundry.status !== filter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [laundry.name, laundry.address, laundry.availability]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [filter, laundries, search]);

  const summaryStats = useMemo(
    () => [
      { label: "Total Laundries", value: laundries.length, color: "text-[#1D6076]" },
      { label: "Active", value: laundries.filter((laundry) => laundry.status === "Active").length, color: "text-emerald-600" },
      { label: "Inactive", value: laundries.filter((laundry) => laundry.status === "Inactive").length, color: "text-red-600" },
      { label: "Open Now", value: laundries.filter((laundry) => laundry.availability === "Open").length, color: "text-amber-600" },
    ],
    [laundries],
  );

  async function handleStatusChange(laundry: LaundryRecord) {
    const nextStatus = laundry.status === "Active" ? "Inactive" : "Active";
    let reason: string | undefined;

    if (nextStatus === "Inactive") {
      const promptValue = window.prompt("Enter a suspension reason for this laundry:");
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
        current.map((item) => (item.id === laundry.id ? { ...item, status: nextStatus } : item)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update laundry status.");
    } finally {
      setIsUpdatingId(null);
    }
  }

  function exportLaundries() {
    const header = ["Id", "Name", "Address", "Status", "Availability", "AverageRating", "CreatedAt"];
    const rows = filtered.map((laundry) => [
      laundry.id,
      escapeCsv(laundry.name),
      escapeCsv(laundry.address),
      laundry.status,
      laundry.availability,
      laundry.averageRating,
      laundry.createdAt,
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laundries.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laundries Management</h1>
          <p className="text-sm text-slate-500 mt-1">Connected to `GET /api/admin/laundries` and `PUT /api/admin/laundries/:id/status`.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            <p className={clsx("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {(["All", "Active", "Inactive"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  filter === value ? "bg-[#1D6076] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search laundries..."
                className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1D6076]/10 focus:border-[#1D6076]/30"
              />
            </div>
            <button
              onClick={exportLaundries}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
            <LoaderCircle size={18} className="mr-2 animate-spin" />
            Loading laundries...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["ID", "Laundry", "Address", "Status", "Availability", "Rating", "Joined", "Actions"].map((heading) => (
                      <th key={heading} className="pb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap px-3 first:pl-0">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((laundry) => {
                    const status = statusConfig[laundry.status];
                    const StatusIcon = status.icon;

                    return (
                      <tr key={laundry.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 first:pl-0 text-xs text-slate-400 font-mono">#{laundry.id}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D6076]/10 text-[#1D6076]">
                              {laundry.imageUrl ? (
                                <img src={laundry.imageUrl} alt={laundry.name} className="h-full w-full rounded-xl object-cover" />
                              ) : (
                                <Store size={16} />
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800">{laundry.name}</p>
                              <p className="text-[11px] text-slate-400">Backend id: {laundry.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={12} className="text-slate-300" />
                            {laundry.address}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={clsx("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border", status.color)}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={clsx("rounded-full px-2 py-1 text-[10px] font-semibold", availabilityConfig[laundry.availability])}>
                            {laundry.availability}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-slate-600">{laundry.averageRating.toFixed(1)}</td>
                        <td className="py-3 px-3 text-xs text-slate-500">{formatDate(laundry.createdAt)}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleStatusChange(laundry)}
                            disabled={isUpdatingId === laundry.id}
                            className={clsx(
                              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                              laundry.status === "Active"
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                            )}
                          >
                            {isUpdatingId === laundry.id ? <LoaderCircle size={14} className="animate-spin" /> : <Clock3 size={14} />}
                            {laundry.status === "Active" ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing {filtered.length} of {laundries.length} laundries</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
