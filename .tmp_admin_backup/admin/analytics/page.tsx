"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, Users, DollarSign, Activity, AlertTriangle, Wallet, Layers, ShoppingBag 
} from "lucide-react";
import { BASE_URL, getAuthHeaders } from "@/app/services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface MonthlyRevenueDto {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
}

interface OrderStatusDistributionDto {
  name: string;
  value: number;
  color: string;
}

interface SystemAnalyticsDto {
  totalRevenue: number;
  revenueGrowth: string;
  totalOrders: number;
  ordersToday: number;
  ordersTodayGrowth: string;
  activeLaundries: number;
  laundriesGrowth: string;
  totalUsers: number;
  usersGrowth: string;
  newUsersThisMonth: number;
  totalCommissions: number;
  totalPendingDebts: number;
  totalSuspiciousActivities: number;
  mostActiveLaundry: string;
  monthlyRevenue: MonthlyRevenueDto[];
  orderStatusDistribution: OrderStatusDistributionDto[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<SystemAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${BASE_URL}/analytics/system`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <Activity size={32} className="animate-pulse text-[#2A5C66]" />
      </div>
    );
  }

  const KPICard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass.split(" ")[0]}`}></div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 font-medium text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <span className="text-sm font-semibold text-green-500 bg-green-50 px-2 py-1 rounded-md">{sub}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 size={32} className="text-[#2A5C66]" />
            Platform Analytics
          </h1>
          <p className="text-slate-500 mt-2">Comprehensive overview of the entire Ndeef App ecosystem.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Platform Revenue" value={`EGP ${data.totalRevenue.toLocaleString()}`} sub={data.revenueGrowth} icon={DollarSign} colorClass="bg-green-100 text-green-600" />
        <KPICard title="Total Orders" value={data.totalOrders.toLocaleString()} sub={data.ordersTodayGrowth} icon={ShoppingBag} colorClass="bg-blue-100 text-blue-600" />
        <KPICard title="Active Users" value={data.totalUsers.toLocaleString()} sub={data.usersGrowth} icon={Users} colorClass="bg-purple-100 text-purple-600" />
        <KPICard title="Platform Commissions" value={`EGP ${data.totalCommissions.toLocaleString()}`} sub="Lifetime" icon={Wallet} colorClass="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-800">Revenue & Profit Trends</h3>
            <p className="text-sm text-slate-500">Monthly overview of total revenue vs platform profit</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A5C66" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2A5C66" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(v) => `£${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" name="Total Revenue" dataKey="revenue" stroke="#2A5C66" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name="Platform Profit" dataKey="profit" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-6">Security & Debts</h3>
            
            <div className="space-y-6">
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900">Fraud Alerts</h4>
                    <p className="text-red-600 text-sm">Suspicious activities caught by AI</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-red-700 mt-2">{data.totalSuspiciousActivities}</div>
              </div>

              <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900">Pending Debts</h4>
                    <p className="text-orange-600 text-sm">Owed by laundries to platform</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-orange-700 mt-2">
                  EGP {data.totalPendingDebts.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
