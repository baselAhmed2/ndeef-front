import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Download, LoaderCircle, Search, ShieldCheck, UserX, Users } from "lucide-react";
import clsx from "clsx";
import { apiRequest, ApiError } from "../../lib/admin-api";
import type { UserRecord } from "../../types/admin";

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

export function UsersManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiRequest<UserRecord[]>("/admin/users");
        if (isMounted) {
          setUsers(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : "Failed to load users.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email, user.role, user.phoneNumber || ""].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, users]);

  const stats = useMemo(
    () => [
      { label: "Total Users", value: users.length, icon: Users, color: "from-[#1D6076] to-[#2a8ba8]" },
      { label: "Active Users", value: users.filter((user) => user.isActive).length, icon: ShieldCheck, color: "from-emerald-500 to-emerald-600" },
      { label: "Inactive Users", value: users.filter((user) => !user.isActive).length, icon: UserX, color: "from-red-500 to-red-600" },
      {
        label: "Laundry Admins",
        value: users.filter((user) => user.role === "LaundryAdmin").length,
        icon: ShieldCheck,
        color: "from-[#EBA050] to-[#d68b3a]",
      },
    ],
    [users],
  );

  async function handleStatusChange(user: UserRecord) {
    const nextIsActive = !user.isActive;
    let reason: string | undefined;

    if (!nextIsActive) {
      const promptValue = window.prompt("Enter a suspension reason for this user:");
      if (!promptValue) {
        return;
      }
      reason = promptValue;
    }

    setIsUpdatingId(user.id);
    setError(null);

    try {
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: nextIsActive,
          reason,
        }),
      });

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isActive: nextIsActive } : item)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update user status.");
    } finally {
      setIsUpdatingId(null);
    }
  }

  function exportUsers() {
    const header = ["Id", "Name", "Email", "PhoneNumber", "Role", "IsActive", "CreatedAt"];
    const rows = filtered.map((user) => [
      user.id,
      escapeCsv(user.name),
      user.email,
      user.phoneNumber || "",
      user.role,
      user.isActive,
      user.createdAt,
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users Management</h1>
        <p className="text-sm text-slate-500 mt-1">Connected to `GET /api/admin/users` and `PUT /api/admin/users/:id/status`.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className={clsx("mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white", stat.color)}>
              <stat.icon size={16} />
            </div>
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-64 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs"
            />
          </div>
          <button
            onClick={exportUsers}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
            <LoaderCircle size={18} className="mr-2 animate-spin" />
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {["User", "Phone", "Role", "Status", "Joined", "Actions"].map((heading) => (
                    <th key={heading} className="pb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <p className="text-[13px] font-semibold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">{user.phoneNumber || "Not provided"}</td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{user.role}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={clsx(
                          "text-[10px] font-semibold px-2 py-1 rounded-md border",
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-700 border-red-100",
                        )}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">{formatDate(user.createdAt)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleStatusChange(user)}
                        disabled={isUpdatingId === user.id}
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                          user.isActive ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        )}
                      >
                        {isUpdatingId === user.id ? <LoaderCircle size={14} className="animate-spin" /> : null}
                        {user.isActive ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
