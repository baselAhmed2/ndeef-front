import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  CreditCard,
  Building2,
  Smartphone,
  User,
  Activity,
  Calendar,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { getLaundryBillingInfo, getUserLaundryBillingInfo, type LaundryBillingInfo } from "../lib/admin-api";
import clsx from "clsx";

interface LaundryBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  laundryId?: number | null;
  adminId?: string | null;
}

export function LaundryBillingModal({
  isOpen,
  onClose,
  laundryId,
  adminId,
}: LaundryBillingModalProps) {
  const [billingInfo, setBillingInfo] = useState<LaundryBillingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setBillingInfo(null);
      setError(null);
      return;
    }

    async function fetchBilling() {
      setIsLoading(true);
      setError(null);
      try {
        let data: LaundryBillingInfo;
        if (laundryId) {
          data = await getLaundryBillingInfo(laundryId);
        } else if (adminId) {
          data = await getUserLaundryBillingInfo(adminId);
        } else {
          throw new Error("No target laundry or admin specified.");
        }
        setBillingInfo(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load billing information.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBilling();
  }, [isOpen, laundryId, adminId]);

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "bank":
      case "bankaccount":
        return <Building2 className="text-sky-400" size={16} />;
      case "mobilewallet":
        return <Smartphone className="text-emerald-400" size={16} />;
      case "card":
      case "octocard":
        return <CreditCard className="text-purple-400" size={16} />;
      default:
        return <CreditCard className="text-amber-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "suspended":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[640px] overflow-hidden rounded-[28px] border-none bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0e1726] text-white shadow-2xl shadow-slate-950/50">
          {/* Neon mesh gradient decoration */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.15),_transparent_35%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

          {isLoading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-slate-400">
              <LoaderCircle size={36} className="animate-spin text-blue-500 mb-4" />
              <p className="text-sm font-medium">Fetching billing records...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
                <AlertTriangle size={24} />
              </div>
              <DialogTitle className="text-xl font-semibold text-white">Retrieval Failed</DialogTitle>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">{error}</p>
              <DialogFooter className="mt-6 w-full px-6">
                <button
                  onClick={onClose}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Close
                </button>
              </DialogFooter>
            </div>
          ) : billingInfo ? (
            <div className="relative p-6 sm:p-7">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    <Wallet size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300">
                        Billing & Wallet Profile
                      </span>
                      <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide", getStatusColor(billingInfo.walletStatus))}>
                        {billingInfo.walletStatus}
                      </span>
                    </div>
                    <DialogTitle className="mt-2 text-xl font-bold tracking-tight text-white">
                      {billingInfo.laundryName}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-xs text-slate-450">
                      Managed by <span className="font-semibold text-slate-200">{billingInfo.adminName}</span> ({billingInfo.adminEmail})
                    </DialogDescription>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </DialogHeader>

              {/* Grid of Wallet Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available Balance</span>
                    <ArrowUpRight size={14} className="text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">EGP {billingInfo.availableBalance.toFixed(2)}</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Commission</span>
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-amber-400">EGP {billingInfo.pendingCommission.toFixed(2)}</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Earnings</span>
                    <Activity size={14} className="text-blue-400" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-blue-300">EGP {billingInfo.totalEarnings.toFixed(2)}</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Debt Ceiling</span>
                    <ShieldCheck size={14} className="text-rose-450" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-rose-300">EGP {billingInfo.debtCeiling.toFixed(2)}</p>
                </div>
              </div>

              {/* Transfer Recipient details */}
              <div className="mt-5 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-3 flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  Payout Destination Details
                </h3>

                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-slate-500">Recipient Name</span>
                    <p className="font-semibold text-slate-200">{billingInfo.recipientFullName || "Not Configured"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">National ID</span>
                    <p className="font-semibold text-slate-200">{billingInfo.nationalId || "Not Configured"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Transfer Method</span>
                    <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                      {getMethodIcon(billingInfo.transferMethod)}
                      <span>{billingInfo.transferMethod}</span>
                    </p>
                  </div>
                  {billingInfo.recipientMobileNumber && (
                    <div className="space-y-1">
                      <span className="text-slate-500">Mobile Wallet Number</span>
                      <p className="font-semibold text-slate-200">{billingInfo.recipientMobileNumber}</p>
                    </div>
                  )}
                  {billingInfo.bankName && (
                    <div className="space-y-1">
                      <span className="text-slate-500">Bank Name</span>
                      <p className="font-semibold text-slate-200">{billingInfo.bankName}</p>
                    </div>
                  )}
                  {billingInfo.bankAccountNumber && (
                    <div className="space-y-1 col-span-2">
                      <span className="text-slate-500">Bank Account / IBAN</span>
                      <p className="font-semibold text-slate-200 font-mono tracking-wider">{billingInfo.bankAccountNumber}</p>
                    </div>
                  )}
                  {billingInfo.cardNumber && (
                    <div className="space-y-1">
                      <span className="text-slate-500">Card Number</span>
                      <p className="font-semibold text-slate-200 font-mono tracking-wider">{billingInfo.cardNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer info: Last payout date */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Last Payout Date:
                </span>
                <span className="font-semibold text-slate-400">
                  {billingInfo.lastPayoutDate ? new Date(billingInfo.lastPayoutDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) : "Never"}
                </span>
              </div>

              <DialogFooter className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Close
                </button>
              </DialogFooter>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
