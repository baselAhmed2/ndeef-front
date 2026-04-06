import { motion } from "motion/react";
import { useState } from "react";
import {
  Settings as SettingsIcon, Shield, Bell, Key, Globe, Monitor,
  Save, Smartphone, CreditCard, Lock
} from "lucide-react";
import clsx from "clsx";

const tabs = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
];

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");

  const anim = {
    container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } },
    item: { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <motion.div variants={anim.container} initial="hidden" animate="show" className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <motion.div variants={anim.item}>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage global configuration for the Ndeef platform.</p>
        </motion.div>
        <motion.button 
          variants={anim.item}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-[#1D6076] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-[#1D6076]/20 hover:bg-[#164a5c] transition-colors"
        >
          <Save size={16} /> Save Changes
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <motion.div variants={anim.item} className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100/80 p-2 shadow-sm">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group",
                    active ? "text-[#1D6076]" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                >
                  {active && (
                    <motion.div 
                      layoutId="settings-tab" 
                      className="absolute inset-0 bg-[#1D6076]/5 rounded-xl z-0" 
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <t.icon size={18} className={clsx("relative z-10 transition-colors", active ? "text-[#1D6076]" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={anim.item} className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 sm:p-8 shadow-sm">
            
            {activeTab === "general" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Globe size={18} className="text-[#1D6076]" /> Regional Settings
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">Configure the primary operating region and currency.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Default Currency</label>
                      <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1D6076]/10 focus:border-[#1D6076]/30 transition-all outline-none">
                        <option>SAR - Saudi Riyal</option>
                        <option>AED - UAE Dirham</option>
                        <option>USD - US Dollar</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Timezone</label>
                      <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1D6076]/10 focus:border-[#1D6076]/30 transition-all outline-none">
                        <option>Asia/Riyadh (GMT+3)</option>
                        <option>Asia/Dubai (GMT+4)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <CreditCard size={18} className="text-[#EBA050]" /> Payment Configuration
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">Manage commission rates and payout cycles.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Default Platform Commission (%)</label>
                      <div className="relative">
                        <input type="number" defaultValue={12} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-[#1D6076]/10 focus:border-[#1D6076]/30 transition-all outline-none" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Payout Cycle</label>
                      <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1D6076]/10 focus:border-[#1D6076]/30 transition-all outline-none">
                        <option>Weekly (Every Sunday)</option>
                        <option>Bi-Weekly</option>
                        <option>Monthly (1st of Month)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Monitor size={18} className="text-slate-500" /> Maintenance Mode
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">Temporarily disable customer apps and laundry dashboards.</p>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                    <div>
                      <p className="text-sm font-bold text-amber-800">Enable Maintenance Mode</p>
                      <p className="text-xs text-amber-600 mt-0.5">Only Super Admins will be able to access the platform.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Lock size={18} className="text-[#1D6076]" /> Admin Security
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">Enforce strict access policies for the admin panel.</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
                        <p className="text-xs text-slate-500 mt-0.5">Require all admins to use an authenticator app.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D6076]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Session Timeout</p>
                        <p className="text-xs text-slate-500 mt-0.5">Automatically log out inactive administrators.</p>
                      </div>
                      <select className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#1D6076]/10 focus:border-[#1D6076]/30 outline-none">
                        <option>15 Minutes</option>
                        <option>30 Minutes</option>
                        <option>1 Hour</option>
                        <option>Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other tabs can be similarly populated */}
            {(activeTab === "notifications" || activeTab === "api") && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  {activeTab === "notifications" ? <Bell size={24} className="text-slate-300" /> : <Key size={24} className="text-slate-300" />}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Coming Soon</h3>
                <p className="text-sm text-slate-500 max-w-sm">This settings module is currently under active development and will be available in the next platform update.</p>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}