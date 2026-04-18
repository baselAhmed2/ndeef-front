"use client";

import { useState, useEffect } from "react";
import { getComplaints, updateComplaintStatus } from "@/app/lib/laundry-admin-client";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquareWarning,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";

interface Complaint {
  id: string;
  orderId?: string;
  customerName: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  date: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  const [activeFilter, setActiveFilter] = useState<"All" | "Open" | "In Progress" | "Resolved">("All");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setError("");
        const data = await getComplaints();
        if (data && Array.isArray(data)) {
          setComplaints(data);
        }
      } catch (err) {
        console.error("Failed to load complaints", err);
        setError(err instanceof Error ? err.message : "Failed to load complaints.");
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.orderId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customerEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customerPhone ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeFilter === "All" || c.status === activeFilter;
    return matchesSearch && matchesTab;
  });

  const handleStatusChange = async (
    complaintId: string,
    status: Complaint["status"],
  ) => {
    try {
      setSavingStatus(complaintId);
      setError("");
      await updateComplaintStatus(complaintId, status);
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === complaintId ? { ...complaint, status } : complaint,
        ),
      );
      setSelectedComplaint((prev) =>
        prev && prev.id === complaintId ? { ...prev, status } : prev,
      );
    } catch (err) {
      console.error("Failed to update complaint status", err);
      setError(err instanceof Error ? err.message : "Failed to update complaint status.");
    } finally {
      setSavingStatus(null);
    }
  };

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
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
          {(["All", "Open", "In Progress", "Resolved"] as const).map((tab) => (
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
                  onClick={() => setSelectedComplaint(ticket)}
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
                    <div className="flex items-center gap-2">
                      {ticket.status !== "In Progress" && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleStatusChange(ticket.id, "In Progress");
                          }}
                          disabled={savingStatus === ticket.id}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
                        >
                          {savingStatus === ticket.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Mark In Progress"}
                        </button>
                      )}
                      {ticket.status !== "Resolved" && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleStatusChange(ticket.id, "Resolved");
                          }}
                          disabled={savingStatus === ticket.id}
                          className="rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60"
                        >
                          {savingStatus === ticket.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resolve"}
                        </button>
                      )}
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
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Complaint Details</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedComplaint.customerName}
                    {selectedComplaint.orderId ? ` • Order ${selectedComplaint.orderId}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-xl bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Issue</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedComplaint.description || selectedComplaint.subject}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer Email</p>
                    <p className="mt-1 text-sm text-gray-700">{selectedComplaint.customerEmail || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer Phone</p>
                    <p className="mt-1 text-sm text-gray-700">{selectedComplaint.customerPhone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
                    <p className="mt-1 text-sm text-gray-700">{selectedComplaint.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Received</p>
                    <p className="mt-1 text-sm text-gray-700">{selectedComplaint.date}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {selectedComplaint.status !== "In Progress" && (
                    <button
                      onClick={() => void handleStatusChange(selectedComplaint.id, "In Progress")}
                      disabled={savingStatus === selectedComplaint.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
                    >
                      {savingStatus === selectedComplaint.id ? "Saving..." : "Mark In Progress"}
                    </button>
                  )}
                  {selectedComplaint.status !== "Resolved" && (
                    <button
                      onClick={() => void handleStatusChange(selectedComplaint.id, "Resolved")}
                      disabled={savingStatus === selectedComplaint.id}
                      className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60"
                    >
                      {savingStatus === selectedComplaint.id ? "Saving..." : "Resolve Complaint"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
