"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Search,
  Loader2,
  Smartphone,
  Wallet,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  getLaundryPayouts,
  getLaundryBillingInfo,
  getUserLaundryBillingInfo,
  type LaundryPayoutRecord,
  recordCommissionPayment,
  sendPaymentReminder,
  upsertLaundryPayoutProfile,
  type LaundryBillingInfo,
} from "@/app/lib/admin-api";
import { apiRequest, ApiError } from "@/app/lib/admin-api";
import {
  PayoutTransferMethod,
  PayoutTransferType,
  type UpsertPayoutProfileRequest,
} from "@/app/lib/api";
import {
  buildPayoutPayload,
  getDefaultTransferType,
  getMethodLabel,
  getTransferTypeLabel,
  needsTransferType,
  parseTransferMethod,
  parseTransferType,
  payoutMethodOptions,
} from "@/app/lib/payout-profile";
import type { LaundryRecord, UserRecord } from "@/app/types/admin";

function getMethodIcon(method: string | number) {
  if (!method) return <Wallet className="h-4 w-4 text-slate-500" />;
  switch (String(method).toLowerCase()) {
    case "banktransfer":
    case "instapay":
    case "bank":
    case "bankaccount":
      return <Building2 className="h-4 w-4 text-sky-600" />;
    case "mobilewallet":
      return <Smartphone className="h-4 w-4 text-emerald-600" />;
    case "card":
    case "octocard":
      return <CreditCard className="h-4 w-4 text-violet-600" />;
    default:
      return <Wallet className="h-4 w-4 text-slate-500" />;
  }
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-sm font-semibold text-slate-900 ${mono ? "font-mono tracking-wide" : ""}`}>
        {value || "Not Configured"}
      </p>
    </div>
  );
}

export default function AdminPayoutProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laundryId = searchParams?.get("laundryId");
  const adminId = searchParams?.get("adminId");

  const [loading, setLoading] = useState(true);
  const [selectorLoading, setSelectorLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<LaundryBillingInfo | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<LaundryPayoutRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [laundries, setLaundries] = useState<LaundryRecord[]>([]);
  const [laundryAdmins, setLaundryAdmins] = useState<UserRecord[]>([]);
  const [selectorError, setSelectorError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpsertPayoutProfileRequest>({
    transferMethod: PayoutTransferMethod.BankAccount,
    transferType: getDefaultTransferType(PayoutTransferMethod.BankAccount),
    recipientFullName: "",
    recipientMobileNumber: "",
    bankName: "",
    bankAccountNumber: "",
    cardNumber: "",
    nationalId: "",
  });

  const targetLabel = useMemo(() => {
    if (laundryId) return `laundry #${laundryId}`;
    if (adminId) return `admin ${adminId}`;
    return null;
  }, [adminId, laundryId]);

  const payoutAmount = Number(billingInfo?.availableBalance ?? 0);
  const hasPayoutDestination = Boolean(
    billingInfo?.recipientFullName &&
      billingInfo?.transferMethod &&
      billingInfo.transferMethod !== "Not Configured",
  );
  const payoutBlockedReason = !hasPayoutDestination
    ? "Configure the payout destination first."
    : payoutAmount <= 0
      ? "No available balance is ready for payout."
      : null;

  const filteredLaundries = useMemo(() => {
    const query = selectorSearch.trim().toLowerCase();
    if (!query) return laundries.slice(0, 8);

    return laundries
      .filter((laundry) =>
        [laundry.name, laundry.address, String(laundry.id)]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      )
      .slice(0, 8);
  }, [laundries, selectorSearch]);

  const filteredAdmins = useMemo(() => {
    const query = selectorSearch.trim().toLowerCase();
    const admins = laundryAdmins.filter((user) => user.role === "LaundryAdmin");
    if (!query) return admins.slice(0, 8);

    return admins
      .filter((user) =>
        [user.name, user.email, user.phoneNumber || "", user.id]
          .some((value) => value.toLowerCase().includes(query)),
      )
      .slice(0, 8);
  }, [laundryAdmins, selectorSearch]);

  useEffect(() => {
    let active = true;

    async function loadSelectorData() {
      if (laundryId || adminId) {
        setSelectorLoading(false);
        return;
      }

      try {
        setSelectorLoading(true);
        setSelectorError(null);

        const [laundriesResponse, usersResponse] = await Promise.all([
          apiRequest<LaundryRecord[]>("/admin/laundries"),
          apiRequest<UserRecord[]>("/admin/users"),
        ]);

        if (!active) return;
        setLaundries(laundriesResponse);
        setLaundryAdmins(usersResponse.filter((user) => user.role === "LaundryAdmin"));
      } catch (selectorLoadError) {
        if (!active) return;
        setSelectorError(
          selectorLoadError instanceof ApiError
            ? selectorLoadError.message
            : "Failed to load laundries and laundry admins.",
        );
      } finally {
        if (active) {
          setSelectorLoading(false);
        }
      }
    }

    void loadSelectorData();

    return () => {
      active = false;
    };
  }, [adminId, laundryId]);

  useEffect(() => {
    let active = true;

    async function loadBillingInfo() {
      if (!laundryId && !adminId) {
        setLoading(false);
        setBillingInfo(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = laundryId
          ? await getLaundryBillingInfo(laundryId)
          : await getUserLaundryBillingInfo(adminId as string);

        if (!active) return;
        setBillingInfo(result);

        const payouts = await getLaundryPayouts(result.laundryId).catch(() => []);
        if (!active) return;
        setPayoutHistory(payouts);
      } catch (loadError: any) {
        if (!active) return;
        const message = loadError?.message || "Failed to load payout profile.";
        setError(message);
        toast.error(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBillingInfo();

    return () => {
      active = false;
    };
  }, [adminId, laundryId]);

  useEffect(() => {
    if (billingInfo) {
      // Map string transferMethod to PayoutTransferMethod enum
      const method = parseTransferMethod(billingInfo.transferMethod);
      const type = parseTransferType(billingInfo.transferType) ?? getDefaultTransferType(method);

      setFormData({
        transferMethod: method,
        transferType: type,
        recipientFullName: billingInfo.recipientFullName || "",
        recipientMobileNumber: billingInfo.recipientMobileNumber || "",
        bankName: billingInfo.bankName || "",
        bankAccountNumber: billingInfo.bankAccountNumber || "",
        cardNumber: billingInfo.cardNumber || "",
        nationalId: billingInfo.nationalId || "",
      });
    }
  }, [billingInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "transferMethod") {
        const nextMethod = Number(value) as PayoutTransferMethod;
        return {
          ...prev,
          transferMethod: nextMethod,
          transferType: getDefaultTransferType(nextMethod),
        };
      }

      return {
        ...prev,
        [name]: name === "transferType" ? Number(value) : value,
      };
    });
  };

  const validateForm = () => {
    if (!formData.recipientFullName.trim()) {
      toast.error("Please enter the recipient full name.");
      return false;
    }

    if (!formData.nationalId || formData.nationalId.length !== 14 || !/^\d+$/.test(formData.nationalId)) {
      toast.error("National ID must be exactly 14 digits.");
      return false;
    }

    if (formData.transferMethod === PayoutTransferMethod.BankAccount) {
      if (!formData.bankName?.trim()) {
        toast.error("Please enter the Bank Name.");
        return false;
      }
      if (!formData.bankAccountNumber?.trim()) {
        toast.error("Please enter the Bank Account Number.");
        return false;
      }
    } else if (formData.transferMethod === PayoutTransferMethod.MobileWallet) {
      if (!formData.recipientMobileNumber?.trim()) {
        toast.error("Please enter the Mobile Wallet Number.");
        return false;
      }
      if (!formData.transferType) {
        toast.error("Please select the transfer type.");
        return false;
      }
    } else if (formData.transferMethod === PayoutTransferMethod.BankTransfer) {
      if (!formData.bankAccountNumber?.trim()) {
        toast.error("Please enter the bank transfer destination.");
        return false;
      }
    } else if (formData.transferMethod === PayoutTransferMethod.Instapay) {
      if (formData.transferType === PayoutTransferType.MobileNumber && !formData.recipientMobileNumber?.trim()) {
        toast.error("Please enter the Instapay mobile number.");
        return false;
      }
      if (formData.transferType === PayoutTransferType.InstapayAddress && !formData.bankAccountNumber?.trim()) {
        toast.error("Please enter the Instapay address.");
        return false;
      }
    } else if (formData.transferMethod === PayoutTransferMethod.Card) {
      if (!formData.bankName?.trim()) {
        toast.error("Please enter the Bank Name.");
        return false;
      }
      if (!formData.cardNumber?.trim()) {
        toast.error("Please enter the Card Number.");
        return false;
      }
    } else if (formData.transferMethod === PayoutTransferMethod.OctoCard) {
      if (!formData.cardNumber?.trim()) {
        toast.error("Please enter the Card Number.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingInfo?.laundryId) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      await upsertLaundryPayoutProfile(billingInfo.laundryId, buildPayoutPayload(formData));
      toast.success("Payout profile saved successfully!");
      
      // Reload billing info
      const result = laundryId
        ? await getLaundryBillingInfo(laundryId)
        : await getUserLaundryBillingInfo(adminId as string);
      setBillingInfo(result);
      setPayoutHistory(await getLaundryPayouts(result.laundryId).catch(() => []));
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save payout profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePayoutAction = async () => {
    if (!billingInfo) return;
    if (payoutBlockedReason) {
      toast.error(payoutBlockedReason);
      return;
    }

    setPayingOut(true);
    try {
      await recordCommissionPayment(String(billingInfo.laundryId), {
        amount: payoutAmount,
        method: "bank_transfer",
        notes: `Manual payout initiated by Super Admin for laundry ${billingInfo.laundryName}.`,
      });
      const refreshedBilling = await getLaundryBillingInfo(billingInfo.laundryId);
      setBillingInfo(refreshedBilling);
      setPayoutHistory(await getLaundryPayouts(billingInfo.laundryId).catch(() => []));
      toast.success("Payout processed successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to record the payout.");
    } finally {
      setPayingOut(false);
    }
  };

  const handleReminder = async () => {
    if (!billingInfo) return;

    setSendingReminder(true);
    try {
      await sendPaymentReminder(String(billingInfo.laundryId));
      toast.success("Payment reminder sent.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send payment reminder.");
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D5B70]" />
      </div>
    );
  }

  if (!laundryId && !adminId) {
    return (
      <div className="mx-auto max-w-6xl p-6 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Payout Profile</h1>
              <p className="mt-2 text-sm text-slate-600">
                Select a laundry or laundry admin to open billing and payout details.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={selectorSearch}
                onChange={(event) => setSelectorSearch(event.target.value)}
                placeholder="Search by laundry, admin, email, or ID"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/10"
              />
            </div>
          </div>

          {selectorError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {selectorError}
            </div>
          ) : null}

          {selectorLoading ? (
            <div className="mt-8 flex min-h-[220px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#1D5B70]" />
              Loading available billing targets...
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Laundries</h2>
                    <p className="mt-1 text-xs text-slate-500">Open payout profile directly for a laundry.</p>
                  </div>
                  <Link href="/admin/laundries" className="text-xs font-semibold text-[#1D5B70] hover:text-[#2a7a94]">
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {filteredLaundries.length ? filteredLaundries.map((laundry) => (
                    <button
                      key={laundry.id}
                      type="button"
                      onClick={() => router.push(`/admin/payout-profile?laundryId=${laundry.id}`)}
                      className="flex w-full items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#1D5B70]/30 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{laundry.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{laundry.address}</p>
                      </div>
                      <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        #{laundry.id}
                      </span>
                    </button>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      No laundries matched your search.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Laundry Admins</h2>
                    <p className="mt-1 text-xs text-slate-500">Open billing by the linked admin account.</p>
                  </div>
                  <Link href="/admin/users" className="text-xs font-semibold text-[#1D5B70] hover:text-[#2a7a94]">
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {filteredAdmins.length ? filteredAdmins.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => router.push(`/admin/payout-profile?adminId=${user.id}`)}
                      className="flex w-full items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#1D5B70]/30 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Admin
                      </span>
                    </button>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      No laundry admins matched your search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || !billingInfo) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-2xl font-bold text-slate-900">Payout Profile</h1>
          <p className="mt-3 text-sm text-rose-700">{error || "Unable to load billing data."}</p>
          {targetLabel ? <p className="mt-2 text-sm text-slate-600">Requested target: {targetLabel}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payout Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Billing and payout details for <span className="font-semibold text-slate-700">{billingInfo.laundryName}</span>.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1D5B70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a7a94]"
          >
            <Edit3 className="h-4 w-4" />
            Edit Payout Profile
          </button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Laundry" value={billingInfo.laundryName} />
          <Field label="Admin Name" value={billingInfo.adminName} />
          <Field label="Available Balance" value={`EGP ${billingInfo.availableBalance.toFixed(2)}`} />
          <Field label="Pending Commission" value={`EGP ${billingInfo.pendingCommission.toFixed(2)}`} />
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payout Action</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                EGP {payoutAmount.toFixed(2)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                This is the current available balance that looks ready to be transferred to the laundry owner.
                After backend payout execution, the owner should receive a notification confirming the transferred amount.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handlePayoutAction()}
                disabled={payingOut || Boolean(payoutBlockedReason)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D5B70] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a7a94] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {payingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {payingOut ? "Processing..." : "Release Payout"}
              </button>

              <button
                type="button"
                onClick={() => void handleReminder()}
                disabled={sendingReminder}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                {sendingReminder ? "Sending..." : "Send Reminder"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Payout Destination</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{getMethodLabel(billingInfo.transferMethod)}</p>
            </div>
            <div className="rounded-2xl border border-white bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Payout</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {billingInfo.lastPayoutDate
                  ? new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(billingInfo.lastPayoutDate))
                  : "No payout recorded"}
              </p>
            </div>
            <div className="rounded-2xl border border-white bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Action Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {payoutBlockedReason || "Ready for backend payout execution"}
              </p>
            </div>
          </div>

        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Payout History</h2>
              <p className="mt-1 text-xs text-slate-500">Latest payout transfers recorded for this laundry.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {payoutHistory.length} records
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            {payoutHistory.length ? (
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Method</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Reference</th>
                    <th className="px-3 py-3 font-semibold">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutHistory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-0">
                      <td className="px-3 py-3">
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(item.processedAt))}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">EGP {Number(item.amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-3">{item.method || "-"}</td>
                      <td className="px-3 py-3">{item.status || "-"}</td>
                      <td className="px-3 py-3 font-mono text-xs">{item.reference || "-"}</td>
                      <td className="px-3 py-3">{item.createdBy || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No payout history has been recorded yet.
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="mt-6 border-t border-slate-100 pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Transfer Method</label>
                <div className="relative">
                  <select
                    name="transferMethod"
                    value={formData.transferMethod}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all appearance-none text-sm"
                  >
                    {payoutMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {formData.transferMethod === PayoutTransferMethod.BankAccount && <Building2 className="w-5 h-5" />}
                    {formData.transferMethod === PayoutTransferMethod.MobileWallet && <Smartphone className="w-5 h-5" />}
                    {(formData.transferMethod === PayoutTransferMethod.Card || formData.transferMethod === PayoutTransferMethod.OctoCard) && <CreditCard className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {needsTransferType(formData.transferMethod) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Transfer Type</label>
                  <div className="relative">
                    <select
                      name="transferType"
                      value={formData.transferType || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all appearance-none text-sm"
                    >
                      {formData.transferMethod === PayoutTransferMethod.MobileWallet && <option value={PayoutTransferType.MobileNumber}>Mobile Number</option>}
                      {(formData.transferMethod === PayoutTransferMethod.BankTransfer || formData.transferMethod === PayoutTransferMethod.BankAccount) && (
                        <>
                          <option value={PayoutTransferType.BankAccount}>Bank Account Number</option>
                          <option value={PayoutTransferType.Iban}>IBAN</option>
                        </>
                      )}
                      {formData.transferMethod === PayoutTransferMethod.Instapay && (
                        <>
                          <option value={PayoutTransferType.InstapayAddress}>Instapay Address</option>
                          <option value={PayoutTransferType.MobileNumber}>Mobile Number</option>
                        </>
                      )}
                    </select>
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Recipient Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="recipientFullName"
                    value={formData.recipientFullName}
                    onChange={handleChange}
                    placeholder="Recipient Full Name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    National ID (14 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId || ""}
                    onChange={handleChange}
                    maxLength={14}
                    placeholder="29001010101010"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(formData.transferMethod === PayoutTransferMethod.BankAccount || formData.transferMethod === PayoutTransferMethod.BankTransfer) && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Bank Name {formData.transferMethod === PayoutTransferMethod.BankAccount && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName || ""}
                        onChange={handleChange}
                        placeholder="e.g. CIB, NBE"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {formData.transferType === PayoutTransferType.Iban ? "IBAN" : "Bank Account Number"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber || ""}
                        onChange={handleChange}
                        placeholder={formData.transferType === PayoutTransferType.Iban ? "EG800002000156789012345180002" : "1234567890"}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                      />
                    </div>
                  </>
                )}

                {(formData.transferMethod === PayoutTransferMethod.MobileWallet || (formData.transferMethod === PayoutTransferMethod.Instapay && formData.transferType === PayoutTransferType.MobileNumber)) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {formData.transferMethod === PayoutTransferMethod.MobileWallet ? "Mobile Wallet Number" : "Instapay Mobile Number"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="recipientMobileNumber"
                      value={formData.recipientMobileNumber || ""}
                      onChange={handleChange}
                      placeholder="010..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                    />
                  </div>
                )}

                {formData.transferMethod === PayoutTransferMethod.Instapay && formData.transferType === PayoutTransferType.InstapayAddress && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Instapay Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber || ""}
                      onChange={handleChange}
                      placeholder="name@instapay"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                    />
                  </div>
                )}

                {(formData.transferMethod === PayoutTransferMethod.Card || formData.transferMethod === PayoutTransferMethod.OctoCard) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Card Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber || ""}
                      onChange={handleChange}
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                    />
                  </div>
                )}

                {formData.transferMethod === PayoutTransferMethod.Card && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName || ""}
                      onChange={handleChange}
                      placeholder="e.g. CIB, NBE"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D5B70] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a7a94] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-center gap-2 text-slate-900">
              {getMethodIcon(billingInfo.transferMethod)}
              <h2 className="text-sm font-bold uppercase tracking-wide">Payout Destination</h2>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Transfer Method" value={getMethodLabel(billingInfo.transferMethod)} />
              <Field label="Transfer Type" value={getTransferTypeLabel(billingInfo.transferType)} />
              <Field label="Recipient Name" value={billingInfo.recipientFullName} />
              <Field label="National ID" value={billingInfo.nationalId} mono />
              <Field label="Mobile Wallet Number" value={billingInfo.recipientMobileNumber} mono />
              <Field label="Bank Name" value={billingInfo.bankName} />
              <Field label="Bank Account / IBAN" value={billingInfo.bankAccountNumber} mono />
              <Field label="Card Number" value={billingInfo.cardNumber} mono />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
