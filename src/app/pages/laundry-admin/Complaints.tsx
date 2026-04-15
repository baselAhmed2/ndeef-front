"use client";

import { useState, useEffect } from "react";
import { getComplaints } from "@/app/lib/laundry-admin-client";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquareWarning,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";

interface Complaint {
  id: string;
  orderId?: string;
  customerName: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  date: string;
  description?: string;
}

const statusStyles = {
  Open: { color: "#ef4444", bg: "#fef2f2", icon: AlertCircle },
  "In Progress": { color: "#EBA050", bg: "#fff7ed", icon: Clock },
  Resolved: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
};

export function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Open" | "Resolved">("All");

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const data = await getComplaints();
        if (data && Array.isArray(data)) {
          setComplaints(data);
        }
      } catch (err) {
        console.error("Failed to load complaints", err);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeFilter === "All" || c.status === activeFilter;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-gray-900 font-semibold text-xl flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5" style={{ color: "#1D5B70" }} />
            Customer Complaints
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage and resolve customer issues</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 h-10">
          {(["All", "Open", "Resolved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 text-sm font-medium rounded-lg transition-all ${
                activeFilter === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-pulse" />
            <h3 className="text-gray-900 font-medium">Loading complaints...</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
            <MessageSquareWarning className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium">No complaints found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((ticket, index) => {
              const style = statusStyles[ticket.status] || statusStyles.Open;
              const StatusIcon = style.icon;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 sm:mt-0"
                      style={{ backgroundColor: style.bg }}
                    >
                      <StatusIcon className="w-5 h-5" style={{ color: style.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {ticket.customerName} {ticket.orderId && `• Order ${ticket.orderId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-400">Received</p>
                      <p className="text-sm font-medium text-gray-700">{ticket.date}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1D5B70] group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
