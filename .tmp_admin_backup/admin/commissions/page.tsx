"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Search, Activity } from "lucide-react";
import { BASE_URL, getAuthHeaders } from "@/app/services/api";

interface CommissionTransactionDto {
  id: number;
  laundryName: string;
  orderId: number | null;
  orderAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  createdAt: string;
}

interface LaundryDebtDto {
  laundryId: number;
  laundryName: string;
  totalEarnings: number;
  pendingCommission: number;
  debtCeiling: number;
  status: string;
}

interface SystemCommissionsDto {
  totalPlatformCommissions: number;
  totalPendingDebts: number;
  recentTransactions: CommissionTransactionDto[];
  laundryDebts: LaundryDebtDto[];
}

export default function CommissionsPage() {
  const [data, setData] = useState<SystemCommissionsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"debts" | "transactions">("debts");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/commissions`, {
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

  const filteredDebts = data.laundryDebts.filter(d => 
    d.laundryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Wallet size={32} className="text-[#2A5C66]" />
            Commissions & Debts
          </h1>
          <p className="text-slate-500 mt-2">Manage platform profits and monitor laundry debts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#2A5C66] to-[#1d4047] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 opacity-10 scale-150 transform translate-x-10 -translate-y-10">
            <Wallet size={160} />
          </div>
          <p className="text-white/80 font-medium mb-1">Total Platform Commissions</p>
          <h2 className="text-4xl font-black">EGP {data.totalPlatformCommissions.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm">
            <ArrowUpRight size={16} /> Lifetime Earnings
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 text-slate-800 relative overflow-hidden border border-slate-100 shadow-sm">
          <div className="absolute right-0 top-0 opacity-5 scale-150 transform translate-x-10 -translate-y-10">
            <ArrowDownRight size={160} className="text-orange-500" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Total Pending Debts</p>
          <h2 className="text-4xl font-black text-orange-500">EGP {data.totalPendingDebts.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 bg-orange-50 text-orange-600 w-fit px-3 py-1 rounded-full text-sm">
            <Activity size={16} /> Uncollected Cash
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button 
              className={`flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'debts' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              onClick={() => setActiveTab('debts')}
            >
              Laundry Debts
            </button>
            <button 
              className={`flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'transactions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              onClick={() => setActiveTab('transactions')}
            >
              Recent Transactions
            </button>
          </div>

          {activeTab === 'debts' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search laundries..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#2A5C66]/20 transition-all text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="p-0">
          {activeTab === 'debts' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Laundry Name</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Total Earnings</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Pending Debt</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Debt Ceiling</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDebts.length > 0 ? filteredDebts.map((debt, idx) => {
                    const debtPercentage = (debt.pendingCommission / debt.debtCeiling) * 100;
                    const isDanger = debtPercentage > 80;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-800">{debt.laundryName}</td>
                        <td className="py-4 px-6 text-slate-600">EGP {debt.totalEarnings.toFixed(2)}</td>
                        <td className="py-4 px-6">
                          <span className={`font-bold ${isDanger ? 'text-red-600' : 'text-slate-800'}`}>
                            EGP {debt.pendingCommission.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500">EGP {debt.debtCeiling.toFixed(2)}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            debt.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {debt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No debts found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Transaction ID</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Laundry</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Order Amount</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Collected Commission</th>
                    <th className="font-semibold text-slate-500 text-sm py-4 px-6">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentTransactions.length > 0 ? data.recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-600 text-sm">#TX-{tx.id}</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{tx.laundryName}</td>
                      <td className="py-4 px-6 text-slate-500">EGP {tx.orderAmount.toFixed(2)}</td>
                      <td className="py-4 px-6 font-bold text-green-600">+ EGP {tx.commissionAmount.toFixed(2)}</td>
                      <td className="py-4 px-6 text-slate-400 text-sm">{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
