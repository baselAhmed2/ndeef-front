"use client";

import { useEffect, useState } from "react";
import { getExternalAnalytics, getForecast } from "@/app/lib/laundry-admin-client";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  BarChart2,
  CalendarDays,
  Loader2,
  Star,
  TrendingUp,
} from "lucide-react";

interface AnalyticsData {
  activeOrders: number;
  averageRating: string;
  avgOrderValue: number;
  todayOrders: number;
  totalRevenue: number;
  totalOrders: number;
  mostRequestedService: string;
  history: Array<{ name: string; revenue: number }>;
}

interface ForecastData {
  expectedOrdersNextWeek: number;
  expectedRevenueNextWeek: number;
  demandLevel: string;
  insights?: string;
  dailyBreakdown: Array<{ day: string; expectedOrders: number }>;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const emptyAnalytics: AnalyticsData = {
  activeOrders: 0,
  averageRating: "0.0 / 5",
  avgOrderValue: 0,
  todayOrders: 0,
  totalRevenue: 0,
  totalOrders: 0,
  mostRequestedService: "",
  history: [],
};

const emptyForecast: ForecastData = {
  expectedOrdersNextWeek: 0,
  expectedRevenueNextWeek: 0,
  demandLevel: "Unknown",
  insights: "Forecast is unavailable right now.",
  dailyBreakdown: [],
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);
  const [forecast, setForecast] = useState<ForecastData>(emptyForecast);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [analyticsWarning, setAnalyticsWarning] = useState("");
  const [forecastWarning, setForecastWarning] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError("");
      setAnalyticsWarning("");
      setForecastWarning("");

      const [analyticsResult, forecastResult] = await Promise.allSettled([
        getExternalAnalytics(),
        getForecast(),
      ]);

      if (analyticsResult.status === "fulfilled") {
        setData(analyticsResult.value ?? emptyAnalytics);
      } else {
        console.error("Failed to load laundry analytics", analyticsResult.reason);
        setData(emptyAnalytics);
        setAnalyticsWarning(getErrorMessage(analyticsResult.reason, "Analytics are unavailable right now."));
      }

      if (forecastResult.status === "fulfilled") {
        setForecast(forecastResult.value ?? emptyForecast);
      } else {
        console.error("Failed to load demand forecast", forecastResult.reason);
        setForecast(emptyForecast);
        setForecastWarning(getErrorMessage(forecastResult.reason, "Demand forecast is unavailable right now."));
      }

      if (analyticsResult.status === "rejected" && forecastResult.status === "rejected") {
        setPageError("Analytics data could not be loaded right now.");
      }

      setLoading(false);
    }

    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-[#1D5B70]" />
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {pageError && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
          {pageError}
        </div>
      )}

      {(analyticsWarning || forecastWarning) && (
        <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            {analyticsWarning && <p>{analyticsWarning}</p>}
            {forecastWarning && <p>{forecastWarning}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <BarChart2 className="h-5 w-5 text-[#EBA050]" />
            Advanced Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Revenue insights and backend demand forecast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Active Orders",
            value: data.activeOrders,
            icon: Activity,
            color: "#1D5B70",
          },
          {
            label: "Average Rating",
            value: data.averageRating || "0.0 / 5",
            icon: Star,
            color: "#22c55e",
          },
          {
            label: "Avg. Order Value",
            value: currency.format(data.avgOrderValue),
            icon: TrendingUp,
            color: "#EBA050",
          },
          {
            label: "Today Orders",
            value: data.todayOrders,
            icon: CalendarDays,
            color: "#8b5cf6",
          },
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
            <p className="text-xs text-gray-400">
              Total revenue: {currency.format(data.totalRevenue)}
            </p>
          </div>
          {data.history.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.history} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1D5B70"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              No analytics history available
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Demand Forecast</h3>
              <p className="text-xs text-gray-400">
                {forecast.expectedOrdersNextWeek} expected orders next week
              </p>
            </div>
            <span className="rounded-full bg-[#EBA050]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#B96F20]">
              {forecast.demandLevel || "Unknown"}
            </span>
          </div>
          {forecast.dailyBreakdown.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={forecast.dailyBreakdown} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EBA050" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#EBA050" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expectedOrders"
                  stroke="#EBA050"
                  strokeWidth={3}
                  fill="url(#forecastFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              No forecast available
            </div>
          )}
          {forecast.insights && (
            <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
              {forecast.insights}
            </p>
          )}
        </motion.div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Total Orders</p>
          <p className="mt-1 text-2xl font-black text-gray-950">{data.totalOrders}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Expected Revenue</p>
          <p className="mt-1 text-2xl font-black text-gray-950">
            {currency.format(forecast.expectedRevenueNextWeek)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Most Requested</p>
          <p className="mt-1 text-2xl font-black text-gray-950">
            {data.mostRequestedService || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
