"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import clsx from "clsx";
import { apiRequest, ApiError } from "@/app/lib/admin-api";
import type { FraudAlertRecord, UserRecord } from "@/app/types/admin";

type EnrichedFraudAlert = FraudAlertRecord & {
  userName: string;
  userEmail: string;
};

const recommendationTone = {
  Allow: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Warn: "bg-amber-50 text-amber-700 border-amber-100",
  Block: "bg-red-50 text-red-700 border-red-100",
} as const;

function formatDateTime(isoString: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlertRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    void loadFraudData();
  }, []);

  async function loadFraudData() {
    try {
      setLoading(true);
      setError(null);

      const [alertsResponse, usersResponse] = await Promise.all([
        apiRequest<FraudAlertRecord[]>("/fraud/alerts"),
        apiRequest<UserRecord[]>("/admin/users"),
      ]);

      setAlerts(alertsResponse);
      setUsers(usersResponse);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to fetch fraud alerts.");
    } finally {
      setLoading(false);
    }
  }

  const enrichedAlerts = useMemo<EnrichedFraudAlert[]>(() => {
    const usersMap = new Map(users.map((user) => [user.id, user]));

    return alerts.map((alert) => {
      const user = usersMap.get(alert.userId);

      return {
        ...alert,
        userName: user?.name || `User ${alert.userId}`,
        userEmail: user?.email || "No email available",
      };
    });
  }, [alerts, users]);

  const stats = useMemo(
    () => ({
      total: enrichedAlerts.length,
      highRisk: enrichedAlerts.filter((alert) => alert.riskScore >= 80).length,
      blockRecommended: enrichedAlerts.filter((alert) => alert.aiRecommendedAction === "Block").length,
      affectedUsers: new Set(enrichedAlerts.map((alert) => alert.userId)).size,
    }),
    [enrichedAlerts],
  );

  async function handleReview(id: number, approveBan: boolean) {
    try {
      setReviewingId(id);
      setError(null);
      setSuccessMessage(null);

      await apiRequest(`/fraud/alerts/${id}/review`, {
        method: "PUT",
        body: JSON.stringify({ approveBan }),
      });

      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      setSuccessMessage(
        approveBan ? "Alert reviewed and the account was disabled." : "Alert dismissed successfully.",
      );
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to review alert.");
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoaderCircle size={32} className="animate-spin text-[#2A5C66]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-400 bg-clip-text text-3xl font-bold text-transparent">
            <ShieldAlert size={32} className="text-red-500" />
            AI Fraud Monitor
          </h1>
          <p className="mt-2 text-slate-500">
            Connected to the backend fraud alerts queue and super admin review actions.
          </p>
        </div>

        <button
          onClick={() => void loadFraudData()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 font-medium text-red-600">
          <AlertTriangle /> {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Open Alerts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">High Risk</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.highRisk}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Block Recommended</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{stats.blockRecommended}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Affected Users</p>
          <p className="mt-2 text-3xl font-bold text-[#2A5C66]">{stats.affectedUsers}</p>
        </div>
      </div>

      {enrichedAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white py-20 shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">All Clear!</h3>
          <p className="mt-2 max-w-sm text-center text-slate-500">
            There are no open fraud alerts waiting for super admin review.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrichedAlerts.map((alert) => {
            const isReviewing = reviewingId === alert.id;
            const recommendation =
              alert.aiRecommendedAction in recommendationTone
                ? (alert.aiRecommendedAction as keyof typeof recommendationTone)
                : "Allow";

            return (
              <div
                key={alert.id}
                className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-red-400" />

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                        <Activity size={14} />
                        Risk Score: {alert.riskScore}%
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                        {alert.actionType}
                      </div>
                      <div
                        className={clsx(
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          recommendationTone[recommendation],
                        )}
                      >
                        AI: {alert.aiRecommendedAction}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                        <Clock3 size={14} />
                        {formatDateTime(alert.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        User: <span className="text-red-500">{alert.userName}</span>
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{alert.userEmail}</p>
                      <p className="mt-1 text-xs text-slate-400">User ID: {alert.userId}</p>
                    </div>

                    <p className="rounded-xl border border-red-100/50 bg-red-50/50 p-3 text-sm italic text-slate-600">
                      "{alert.reason || "No detailed reason was provided by the backend."}"
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:w-[340px]">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">IP Address</p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-800">{alert.ipAddress}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Status</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{alert.status}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Alert ID</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">#{alert.id}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={() => void handleReview(alert.id, false)}
                    disabled={isReviewing}
                    className="flex-1 rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-70 sm:flex-none"
                  >
                    {isReviewing ? (
                      <span className="inline-flex items-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Dismiss"
                    )}
                  </button>
                  <button
                    onClick={() => void handleReview(alert.id, true)}
                    disabled={isReviewing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600 disabled:opacity-70 sm:flex-none"
                  >
                    {isReviewing ? <LoaderCircle size={18} className="animate-spin" /> : <Ban size={18} />}
                    Ban Account
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
