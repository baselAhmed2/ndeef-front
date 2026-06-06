"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CreditCard,
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
  getLaundryBillingInfo,
  getUserLaundryBillingInfo,
  upsertLaundryPayoutProfile,
  type LaundryBillingInfo,
} from "@/app/lib/admin-api";
import {
  PayoutTransferMethod,
  PayoutTransferType,
  type UpsertPayoutProfileRequest,
} from "@/app/lib/api";

function getMethodLabel(method: string) {
  if (!method) return "Not Configured";

  switch (method.toLowerCase()) {
    case "bank":
    case "bankaccount":
      return "Bank Account";
    case "mobilewallet":
      return "Mobile Wallet";
    case "card":
      return "Bank Card";
    case "octocard":
      return "Octo Card";
    default:
      return method;
  }
}

function getMethodIcon(method: string) {
  if (!method) return <Wallet className="h-4 w-4 text-slate-500" />;
  switch (method.toLowerCase()) {
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
  const searchParams = useSearchParams();
  const laundryId = searchParams?.get("laundryId");
  const adminId = searchParams?.get("adminId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<LaundryBillingInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<UpsertPayoutProfileRequest>({
    transferMethod: PayoutTransferMethod.BankAccount,
    transferType: null,
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
      let method = PayoutTransferMethod.BankAccount;
      const mStr = (billingInfo.transferMethod || "").toLowerCase();
      if (mStr === "mobilewallet") method = PayoutTransferMethod.MobileWallet;
      else if (mStr === "card") method = PayoutTransferMethod.Card;
      else if (mStr === "octocard") method = PayoutTransferMethod.OctoCard;

      let type: PayoutTransferType | null = null;
      if (billingInfo.transferType) {
        const tStr = billingInfo.transferType.toLowerCase();
        if (tStr.includes("instant")) type = PayoutTransferType.Instant;
        else if (tStr.includes("standard")) type = PayoutTransferType.Standard;
      }

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
          transferType:
            nextMethod === PayoutTransferMethod.MobileWallet
              ? prev.transferType || PayoutTransferType.Standard
              : null,
          recipientMobileNumber:
            nextMethod === PayoutTransferMethod.MobileWallet ? prev.recipientMobileNumber : "",
          bankName:
            nextMethod === PayoutTransferMethod.BankAccount || nextMethod === PayoutTransferMethod.Card
              ? prev.bankName
              : "",
          bankAccountNumber:
            nextMethod === PayoutTransferMethod.BankAccount ? prev.bankAccountNumber : "",
          cardNumber:
            nextMethod === PayoutTransferMethod.Card || nextMethod === PayoutTransferMethod.OctoCard
              ? prev.cardNumber
              : "",
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
        toast.error("Please select the wallet transfer type.");
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
      await upsertLaundryPayoutProfile(billingInfo.laundryId, formData);
      toast.success("Payout profile saved successfully!");
      
      // Reload billing info
      const result = laundryId
        ? await getLaundryBillingInfo(laundryId)
        : await getUserLaundryBillingInfo(adminId as string);
      setBillingInfo(result);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save payout profile.");
    } finally {
      setSaving(false);
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
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Payout Profile</h1>
              <p className="mt-2 text-sm text-slate-600">
                This super admin page requires a target laundry or laundry admin to load billing data.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Open billing from the laundries or users pages, or use a link like
                {" "}
                <span className="font-mono text-slate-800">/admin/payout-profile?laundryId=12</span>.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/admin/laundries"
                  className="rounded-xl bg-[#1D5B70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a7a94]"
                >
                  Go To Laundries
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go To Users
                </Link>
              </div>
            </div>
          </div>
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
                    <option value={PayoutTransferMethod.BankAccount}>Bank Account</option>
                    <option value={PayoutTransferMethod.MobileWallet}>Mobile Wallet</option>
                    <option value={PayoutTransferMethod.Card}>Bank Card</option>
                    <option value={PayoutTransferMethod.OctoCard}>Octo Card</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {formData.transferMethod === PayoutTransferMethod.BankAccount && <Building2 className="w-5 h-5" />}
                    {formData.transferMethod === PayoutTransferMethod.MobileWallet && <Smartphone className="w-5 h-5" />}
                    {(formData.transferMethod === PayoutTransferMethod.Card || formData.transferMethod === PayoutTransferMethod.OctoCard) && <CreditCard className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {formData.transferMethod === PayoutTransferMethod.MobileWallet && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Transfer Type</label>
                  <div className="relative">
                    <select
                      name="transferType"
                      value={formData.transferType || PayoutTransferType.Standard}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all appearance-none text-sm"
                    >
                      <option value={PayoutTransferType.Standard}>Standard Transfer</option>
                      <option value={PayoutTransferType.Instant}>Instant Transfer</option>
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
                {formData.transferMethod === PayoutTransferMethod.BankAccount && (
                  <>
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
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Bank Account Number / IBAN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber || ""}
                        onChange={handleChange}
                        placeholder="EG12000..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D5B70] focus:border-[#1D5B70] transition-all text-sm"
                      />
                    </div>
                  </>
                )}

                {formData.transferMethod === PayoutTransferMethod.MobileWallet && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Mobile Wallet Number <span className="text-red-500">*</span>
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
              <Field label="Transfer Type" value={billingInfo.transferType} />
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
