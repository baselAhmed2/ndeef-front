"use client";

import { useState, useEffect } from "react";
import { getExternalAnalytics, getForecast } from "@/app/lib/laundry-admin-client";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Activity, BarChart2, CalendarDays } from "lucide-react";

const defaultAnalytics = {
  activeUsers: 1420,
  conversionRate: "4.2%",
  avgOrderValue: 85,
  monthlyActive: 5200,
  history: [
    { name: "Week 1", visitors: 4000, orders: 240 },
    { name: "Week 2", visitors: 3000, orders: 139 },
    { name: "Week 3", visitors: 2000, orders: 980 },
    { name: "Week 4", visitors: 2780, orders: 390 },
    { name: "Week 5", visitors: 1890, orders: 480 },
    { name: "Week 6", visitors: 2390, orders: 380 },
    { name: "Week 7", visitors: 3490, orders: 430 },
  ],
};

const defaultForecast = [
  { month: "Jan", prediction: 4000, confidence: [3800, 4200] },
  { month: "Feb", prediction: 3000, confidence: [2800, 3200] },
  { month: "Mar", prediction: 4500, confidence: [4000, 5000] },
  { month: "Apr", prediction: 5100, confidence: [4600, 5600] },
  { month: "May", prediction: 6000, confidence: [5000, 7000] },
  { month: "Jun", prediction: 7500, confidence: [6500, 8500] },
];

export function Analytics() {
  const [data, setData] = useState<any>(defaultAnalytics);
  const [forecast, setForecast] = useState<any[]>(defaultForecast);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticData, forecastData] = await Promise.all([
          getExternalAnalytics().catch(() => null),
          getForecast().catch(() => null),
        ]);
        if (analyticData) setData(analyticData);
        if (forecastData && Array.isArray(forecastData)) setForecast(forecastData);
      } catch (e) {
        console.error("Failed to load analytics", e);
      }
    }
    loadData();
  }, []);

  const historyData = data.history || defaultAnalytics.history;

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-gray-900 font-semibold text-xl flex items-center gap-2">
            <BarChart2 className="w-5 h-5" style={{ color: "#EBA050" }} />
            Advanced Analytics
          </h2>
          <p className="text-gray-400 text-sm mt-1">Platform insights and revenue forecasting</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Users (Daily)", value: data.activeUsers ?? defaultAnalytics.activeUsers, icon: Activity, color: "#1D5B70" },
          { label: "Conversion Rate", value: data.conversionRate ?? defaultAnalytics.conversionRate, icon: TrendingUp, color: "#22c55e" },
          { label: "Avg. Order Value", value: `EGP ${data.avgOrderValue ?? defaultAnalytics.avgOrderValue}`, icon: BarChart2, color: "#EBA050" },
          { label: "Monthly Active", value: data.monthlyActive ?? defaultAnalytics.monthlyActive, icon: CalendarDays, color: "#8b5cf6" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors vs Orders */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Traffic & Conversion History</h3>
            <p className="text-xs text-gray-400">Visitors compared to placed orders</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={historyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Line yAxisId="left" type="monotone" dataKey="visitors" stroke="#1D5B70" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#EBA050" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AI Forecast */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Order Volume Forecast <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">AI Prediction</span>
              </h3>
              <p className="text-xs text-gray-400">Next 6 months prediction</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecast} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Area type="monotone" dataKey="prediction" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
