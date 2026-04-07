import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  CheckCircle,
  Clock3,
  Download,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Store,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { apiRequest, ApiError } from "../../lib/admin-api";
import type {
  CreateLaundryRequest,
  CreateLaundryResponse,
  LaundryRecord,
} from "../../types/admin";

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
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
  });

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

  async function handleCreateLaundry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateLaundryRequest = {
      name: createForm.name.trim(),
      address: createForm.address.trim(),
      latitude: Number(createForm.latitude),
      longitude: Number(createForm.longitude),
    };

    if (!payload.name || !payload.address) {
      setSuccessMessage(null);
      setError("Laundry name and address are required.");
      return;
    }

    if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      setSuccessMessage(null);
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiRequest<CreateLaundryResponse>("/admin/laundries", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdLaundry: LaundryRecord = {
        id: response.laundryId,
        name: payload.name,
        address: payload.address,
        status: "Active",
        availability: "Open",
        averageRating: 0,
        createdAt: new Date().toISOString(),
        imageUrl: null,
      };

      setLaundries((current) => [createdLaundry, ...current]);
      setCreateForm({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
      });
      setSuccessMessage(`${response.message} ID: #${response.laundryId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create laundry.");
    } finally {
      setIsCreating(false);
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
          <p className="text-sm text-slate-500 mt-1">Connected to `GET /api/admin/laundries`, `POST /api/admin/laundries`, and `PUT /api/admin/laundries/:id/status`.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleCreateLaundry} className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add Laundry Directly</h2>
            <p className="text-sm text-slate-500">
              This creates a laundry instantly for the logged-in super admin with Active status and Open availability.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1D6076]/10 px-3 py-1 text-xs font-semibold text-[#1D6076]">
            <Plus size={14} />
            Super Admin Direct Create
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Laundry name</span>
            <input
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Fresh Hub Laundry"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1D6076]/40 focus:bg-white focus:ring-2 focus:ring-[#1D6076]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Address</span>
            <input
              value={createForm.address}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="12 Abbas El Akkad, Nasr City"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1D6076]/40 focus:bg-white focus:ring-2 focus:ring-[#1D6076]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Latitude</span>
            <div className="relative">
              <LocateFixed size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="any"
                value={createForm.latitude}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, latitude: event.target.value }))
                }
                placeholder="30.0444"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#1D6076]/40 focus:bg-white focus:ring-2 focus:ring-[#1D6076]/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Longitude</span>
            <div className="relative">
              <LocateFixed size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="any"
                value={createForm.longitude}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, longitude: event.target.value }))
                }
                placeholder="31.2357"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#1D6076]/40 focus:bg-white focus:ring-2 focus:ring-[#1D6076]/10"
              />
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Required backend payload: <span className="font-mono">name, address, latitude, longitude</span>
          </p>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D6076] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174e60] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreating ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
            {isCreating ? "Creating Laundry..." : "Create Laundry"}
          </button>
        </div>
      </form>

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
