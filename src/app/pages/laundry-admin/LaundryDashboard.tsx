import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Clock, 
  DollarSign,
  Star,
  ChevronRight,
  Filter,
  Download,
  X
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const revenueData = [
  { name: "Mon", revenue: 4000, orders: 120 },
  { name: "Tue", revenue: 3000, orders: 98 },
  { name: "Wed", revenue: 2000, orders: 86 },
  { name: "Thu", revenue: 2780, orders: 105 },
  { name: "Fri", revenue: 1890, orders: 75 },
  { name: "Sat", revenue: 2390, orders: 110 },
  { name: "Sun", revenue: 3490, orders: 130 },
];

const servicePerformance = [
  { name: "Wash & Fold", value: 45 },
  { name: "Dry Cleaning", value: 30 },
  { name: "Ironing", value: 15 },
  { name: "Carpet", value: 10 },
];

const COLORS = ["#1D6076", "#EBA050", "#3fb0d4", "#ffc485"];

const recentOrders = [
  { id: "#5542", customer: "Ahmed M.", service: "Wash & Fold", amount: "SAR 45", status: "Pending", time: "10 mins ago" },
  { id: "#5541", customer: "Sara K.", service: "Dry Cleaning", amount: "SAR 120", status: "In Progress", time: "1 hour ago" },
  { id: "#5540", customer: "Omar B.", service: "Ironing", amount: "SAR 30", status: "Ready", time: "2 hours ago" },
  { id: "#5539", customer: "Faisal R.", service: "Carpet Cleaning", amount: "SAR 250", status: "Delivered", time: "5 hours ago" },
];

// Drill-down Modal Component
function RevenueDrillDownModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Revenue Breakdown</h2>
            <p className="text-sm text-slate-500">Detailed view of today's earnings</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Online Payments</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">SAR 2,450</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Cash on Delivery</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">SAR 890</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Ndeef Commission</p>
              <p className="text-2xl font-bold text-red-500 mt-1">- SAR 334</p>
            </div>
          </div>
          <h3 className="font-semibold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EBA050]/10 flex items-center justify-center text-[#EBA050]">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Order #{5542 - i}</p>
                    <p className="text-xs text-slate-500">Card Payment • 12:4{i} PM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm">+ SAR {(45 + i*15).toFixed(2)}</p>
                  <p className="text-xs text-emerald-500">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LaundryDashboard() {
  const [modalOpen, setModalOpen] = useState(false);

  const stats = [
    { label: "Today's Revenue", value: "SAR 3,340", trend: "+12.5%", isPositive: true, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Active Orders", value: "48", trend: "+5", isPositive: true, icon: Package, color: "text-[#1D6076]", bg: "bg-[#1D6076]/10" },
    { label: "Pending Pickup", value: "12", trend: "-2", isPositive: false, icon: Clock, color: "text-[#EBA050]", bg: "bg-[#EBA050]/10" },
    { label: "Avg Rating", value: "4.8", trend: "+0.2", isPositive: true, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Branch Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your daily laundry operations and performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Filter size={16} />
            <span>This Week</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#EBA050] text-white rounded-xl text-sm font-medium hover:bg-[#d99040] transition-colors shadow-sm shadow-[#EBA050]/20">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer"
            onClick={() => i === 0 && setModalOpen(true)} // Open drill down for revenue
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon size={22} className={stat.color} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
            
            {i === 0 && (
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-[#EBA050] uppercase tracking-wider flex items-center gap-1">
                  View Details <ChevronRight size={12} />
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/40"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue & Orders</h3>
              <p className="text-sm text-slate-500">Weekly performance metrics</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D6076" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1D6076" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1D6076" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Breakdown Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/40"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Services Popularity</h3>
            <p className="text-sm text-slate-500">Breakdown by order count</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicePerformance} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {servicePerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2.5">
            {servicePerformance.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent Orders</h3>
            <p className="text-sm text-slate-500">Latest active orders across all services</p>
          </div>
          <button className="text-sm font-semibold text-[#1D6076] hover:text-[#154656] transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Order ID</th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Service</th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Amount</th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-800">{order.id}</span>
                    <p className="text-[11px] text-slate-400">{order.time}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {order.customer.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700">{order.customer}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-600 font-medium">{order.service}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-800">{order.amount}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Render Modals via Portal or direct state */}
      <AnimatePresence>
        {modalOpen && <RevenueDrillDownModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
