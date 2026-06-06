"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { 
  getLaundryPayoutHistory,
  getPayoutProfile, 
  LaundryPayoutRecord,
  upsertPayoutProfile, 
  PayoutTransferMethod, 
  PayoutTransferType,
  UpsertPayoutProfileRequest 
} from "@/app/lib/api";
import {
  buildPayoutPayload,
  getDefaultTransferType,
  needsTransferType,
  parseTransferMethod,
  parseTransferType,
  payoutMethodOptions,
} from "@/app/lib/payout-profile";
import { toast } from "sonner";
import { Save, Loader2, Building2, Smartphone, CreditCard, Wallet } from "lucide-react";
import { motion } from "motion/react";

export default function PayoutProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<LaundryPayoutRecord[]>([]);

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

  useEffect(() => {
    async function loadData() {
      if (!user?.token) return;
      try {
        const data = await getPayoutProfile(user.token);
        const payouts = await getLaundryPayoutHistory(user.token).catch(() => []);
        setFormData({
          transferMethod: parseTransferMethod(data.transferMethod),
          transferType: parseTransferType(data.transferType) ?? getDefaultTransferType(parseTransferMethod(data.transferMethod)),
          recipientFullName: data.recipientFullName || "",
          recipientMobileNumber: data.recipientMobileNumber || "",
          bankName: data.bankName || "",
          bankAccountNumber: data.bankAccountNumber || "",
          cardNumber: data.cardNumber || "",
          nationalId: data.nationalId || "",
        });
        setPayoutHistory(payouts);
      } catch (err: any) {
        toast.error(err.message || "Failed to load payout profile");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

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
    if (!user?.token) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      await upsertPayoutProfile(user.token, buildPayoutPayload(formData));
      setPayoutHistory(await getLaundryPayoutHistory(user.token).catch(() => payoutHistory));
      toast.success("Payout profile saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save payout profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-[#1D6076] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payout Profile</h1>
        <p className="text-gray-500 text-sm">
          Configure how you want to receive your earnings from Nazeef.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Transfer Method</label>
              <div className="relative">
                <select
                  name="transferMethod"
                  value={formData.transferMethod}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all appearance-none text-sm"
                >
                  {payoutMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {formData.transferMethod === PayoutTransferMethod.BankAccount && <Building2 className="w-5 h-5" />}
                  {formData.transferMethod === PayoutTransferMethod.MobileWallet && <Smartphone className="w-5 h-5" />}
                  {(formData.transferMethod === PayoutTransferMethod.Card || formData.transferMethod === PayoutTransferMethod.OctoCard) && <CreditCard className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {needsTransferType(formData.transferMethod) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Transfer Type</label>
                <div className="relative">
                  <select
                    name="transferType"
                    value={formData.transferType || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all appearance-none text-sm"
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
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recipient Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="recipientFullName"
                  value={formData.recipientFullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  National ID (14 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId || ""}
                  onChange={handleChange}
                  maxLength={14}
                  placeholder="29001010101010"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                />
              </div>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={false}
              animate={{ opacity: 1 }}
            >
              {(formData.transferMethod === PayoutTransferMethod.BankAccount || formData.transferMethod === PayoutTransferMethod.BankTransfer) && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Name {formData.transferMethod === PayoutTransferMethod.BankAccount && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName || ""}
                      onChange={handleChange}
                      placeholder="e.g. CIB, NBE"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {formData.transferType === PayoutTransferType.Iban ? "IBAN" : "Bank Account Number"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber || ""}
                      onChange={handleChange}
                      placeholder={formData.transferType === PayoutTransferType.Iban ? "EG800002000156789012345180002" : "1234567890"}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                    />
                  </div>
                </>
              )}

              {(formData.transferMethod === PayoutTransferMethod.MobileWallet || (formData.transferMethod === PayoutTransferMethod.Instapay && formData.transferType === PayoutTransferType.MobileNumber)) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.transferMethod === PayoutTransferMethod.MobileWallet ? "Mobile Wallet Number" : "Instapay Mobile Number"} <span className="text-red-500">*</span>
                  </label>
                  <input
                  type="text"
                  name="recipientMobileNumber"
                  value={formData.recipientMobileNumber || ""}
                  onChange={handleChange}
                  placeholder="010..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                  />
                </div>
              )}

              {formData.transferMethod === PayoutTransferMethod.Instapay && formData.transferType === PayoutTransferType.InstapayAddress && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Instapay Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber || ""}
                    onChange={handleChange}
                    placeholder="name@instapay"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                  />
                </div>
              )}

              {(formData.transferMethod === PayoutTransferMethod.Card || formData.transferMethod === PayoutTransferMethod.OctoCard) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber || ""}
                  onChange={handleChange}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                />
              </div>
            )}

              {formData.transferMethod === PayoutTransferMethod.Card && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName || ""}
                    onChange={handleChange}
                    placeholder="e.g. CIB, NBE"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                  />
                </div>
              )}
            </motion.div>

          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1D6076] text-white text-sm font-medium rounded-xl hover:bg-[#2a7a94] transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">Payout History</h2>
            <p className="text-sm text-gray-500 mt-1">Recent transfers sent to your payout destination.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {payoutHistory.length} records
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {payoutHistory.length ? (
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
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
                  <tr key={item.id} className="border-b border-gray-100 text-sm text-gray-700 last:border-0">
                    <td className="px-3 py-3">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(item.processedAt))}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900">EGP {Number(item.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">{item.method || "-"}</td>
                    <td className="px-3 py-3">{item.status || "-"}</td>
                    <td className="px-3 py-3 font-mono text-xs">{item.reference || "-"}</td>
                    <td className="px-3 py-3">{item.createdBy || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No payout history has been recorded yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
