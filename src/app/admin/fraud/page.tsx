"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Ban, Activity } from "lucide-react";
import { BASE_URL, getAuthHeaders } from "@/app/services/api";

interface FraudAlert {
  id: number;
  userName: string;
  actionType: string;
  reason: string;
  riskScore: number;
  aiRecommendedAction: string;
  createdAt: string;
}

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/fraud/alerts`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch fraud alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: number, approveBan: boolean) => {
    try {
      const res = await fetch(`${BASE_URL}/fraud/alerts/${id}/review`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ approveBan })
      });
      if (!res.ok) throw new Error("Failed to review alert");
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <Activity size={32} className="animate-pulse text-[#2A5C66]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-400 bg-clip-text text-transparent flex items-center gap-3">
            <ShieldAlert size={32} className="text-red-500" />
            AI Fraud Monitor
          </h1>
          <p className="text-slate-500 mt-2">
            Detects suspicious activity using Cerebras Qwen 3 AI.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-medium">
          <AlertTriangle /> {error}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">All Clear!</h3>
          <p className="text-slate-500 max-w-sm text-center mt-2">
            The AI hasn't detected any suspicious activities on your platform.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 justify-between items-center group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 group-hover:w-2 transition-all"></div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-red-50 text-red-600 font-bold text-sm rounded-full flex items-center gap-1">
                    <Activity size={14} /> Risk Score: {alert.riskScore}%
                  </div>
                  <div className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                    {alert.actionType}
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800">
                  User: <span className="text-red-500">{alert.userName}</span>
                </h3>
                <p className="text-slate-600 bg-red-50/50 p-3 rounded-xl text-sm italic border border-red-100/50">
                  " {alert.reason} "
                </p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleReview(alert.id, false)}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleReview(alert.id, true)}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                >
                  <Ban size={18} /> Ban Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
