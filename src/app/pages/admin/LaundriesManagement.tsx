import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Ban,
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
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
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

function showLaundryStatusToast({
  laundryName,
  nextStatus,
  reason,
}: {
  laundryName: string;
  nextStatus: "Active" | "Inactive";
  reason?: string;
}) {
  const isSuspended = nextStatus === "Inactive";
  const accentClasses = isSuspended
    ? "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-rose-50 text-slate-900"
    : "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900";
  const badgeClasses = isSuspended
    ? "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200"
    : "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200";
  const iconClasses = isSuspended
    ? "bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-200/70"
    : "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/70";
  const Icon = isSuspended ? Ban : CheckCircle;

  toast.custom(
    (id) => (
      <div
        className={clsx(
          "w-[min(92vw,420px)] overflow-hidden rounded-[22px] border p-0 shadow-2xl shadow-slate-900/10 backdrop-blur",
          accentClasses,
        )}
      >
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-900/10 to-transparent" />
          <div className="flex items-start gap-3 p-4">
            <div className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", iconClasses)}>
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={clsx("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", badgeClasses)}>
                  {isSuspended ? "Suspended" : "Activated"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-5 text-slate-900">
                {laundryName} has been {isSuspended ? "suspended" : "activated"} successfully.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {isSuspended
                  ? "The laundry is now inactive and hidden from active operations."
                  : "The laundry is back in service and available for operations."}
              </p>
              {reason ? (
                <div className="mt-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm">
                  <span className="font-semibold text-slate-800">Reason:</span> {reason}
                </div>
              ) : null}
            </div>
            <button
              onClick={() => toast.dismiss(id)}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 4200,
    },
  );
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
  const [suspensionTarget, setSuspensionTarget] = useState<LaundryRecord | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionReasonError, setSuspensionReasonError] = useState<string | null>(null);

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

  function openSuspensionDialog(laundry: LaundryRecord) {
    setSuspensionTarget(laundry);
    setSuspensionReason("");
    setSuspensionReasonError(null);
  }

  function closeSuspensionDialog() {
    setSuspensionTarget(null);
    setSuspensionReason("");
    setSuspensionReasonError(null);
  }

  async function handleStatusChange(laundry: LaundryRecord) {
    const nextStatus = laundry.status === "Active" ? "Inactive" : "Active";
    const reason = nextStatus === "Inactive" ? suspensionReason.trim() : undefined;

    if (nextStatus === "Inactive" && !reason) {
      setSuspensionReasonError("Please enter a clear reason before suspending this laundry.");
      return;
    }

    setIsUpdatingId(laundry.id);
    setError(null);
    setSuspensionReasonError(null);

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
      showLaundryStatusToast({
        laundryName: laundry.name,
        nextStatus,
        reason,
      });
      if (nextStatus === "Inactive") {
        closeSuspensionDialog();
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to update laundry status.";
      setError(message);
      toast.error(message, {
        description: `We couldn't ${nextStatus === "Inactive" ? "suspend" : "activate"} ${laundry.name}. Please try again.`,
      });
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
                            onClick={() => {
                              if (laundry.status === "Active") {
                                openSuspensionDialog(laundry);
                                return;
                              }

                              void handleStatusChange(laundry);
                            }}
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

      <Dialog
        open={Boolean(suspensionTarget)}
        onOpenChange={(open) => {
          if (!open && isUpdatingId === null) {
            closeSuspensionDialog();
          }
        }}
      >
        <DialogContent className="max-w-[560px] overflow-hidden rounded-[28px] border-none bg-transparent p-0 shadow-none">
          <div className="relative overflow-hidden rounded-[28px] border border-amber-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-[#1a2238] text-white shadow-2xl shadow-slate-950/30">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.22),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.18),_transparent_28%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400" />

            <div className="relative p-6 sm:p-7">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 shadow-lg shadow-amber-500/20">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center rounded-full border border-amber-300/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200">
                      Suspend Laundry
                    </div>
                    <DialogTitle className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      Add a suspension reason
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-sm leading-6 text-slate-300">
                      This note explains why <span className="font-semibold text-white">{suspensionTarget?.name}</span> is being suspended and will be attached to this admin action.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <label htmlFor="suspension-reason" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Suspension Reason
                </label>
                <textarea
                  id="suspension-reason"
                  value={suspensionReason}
                  onChange={(event) => {
                    setSuspensionReason(event.target.value);
                    if (suspensionReasonError) {
                      setSuspensionReasonError(null);
                    }
                  }}
                  placeholder="Example: Repeated order delays and unresolved customer complaints."
                  rows={5}
                  className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className={clsx("text-xs", suspensionReasonError ? "text-rose-300" : "text-slate-400")}>
                    {suspensionReasonError ?? "Keep it short, specific, and helpful for future admin review."}
                  </p>
                  <span className="text-xs text-slate-500">{suspensionReason.trim().length} chars</span>
                </div>
              </div>

              <DialogFooter className="mt-6 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={closeSuspensionDialog}
                  disabled={isUpdatingId === suspensionTarget?.id}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => suspensionTarget && void handleStatusChange(suspensionTarget)}
                  disabled={isUpdatingId === suspensionTarget?.id}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUpdatingId === suspensionTarget?.id ? <LoaderCircle size={16} className="animate-spin" /> : <Ban size={16} />}
                  {isUpdatingId === suspensionTarget?.id ? "Suspending..." : "Suspend Laundry"}
                </button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
