"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { 
  getPayoutProfile, 
  upsertPayoutProfile, 
  PayoutTransferMethod, 
  PayoutTransferType, 
  UpsertPayoutProfileRequest 
} from "@/app/lib/api";
import { toast } from "sonner";
import { Save, Loader2, Building2, Smartphone, CreditCard, Wallet } from "lucide-react";
import { motion } from "motion/react";

export default function PayoutProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBackendSupported, setIsBackendSupported] = useState(true);
  const [supportMessage, setSupportMessage] = useState("");

  const [formData, setFormData] = useState<UpsertPayoutProfileRequest>({
    transferMethod: PayoutTransferMethod.BankAccount,
    transferType: PayoutTransferType.Standard,
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
        if (data) {
          setFormData({
            transferMethod: data.transferMethod || PayoutTransferMethod.BankAccount,
            transferType: data.transferType || PayoutTransferType.Standard,
            recipientFullName: data.recipientFullName || "",
            recipientMobileNumber: data.recipientMobileNumber || "",
            bankName: data.bankName || "",
            bankAccountNumber: data.bankAccountNumber || "",
            cardNumber: data.cardNumber || "",
            nationalId: data.nationalId || "",
          });
        }
      } catch (err: any) {
        if (err.status === 404 || err.status === 405 || err.status === 501) {
          setIsBackendSupported(false);
          setSupportMessage(
            "The current backend does not expose payout profile endpoints yet. This screen is ready on the frontend and will activate automatically once the API is available.",
          );
        } else if (err.status !== 400) {
          toast.error(err.message || "Failed to load payout profile");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "transferMethod" || name === "transferType" ? Number(value) : value,
    }));
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
    } else if (
      formData.transferMethod === PayoutTransferMethod.Card ||
      formData.transferMethod === PayoutTransferMethod.OctoCard
    ) {
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
    if (!isBackendSupported) {
      toast.error("Payout profile is not available in the current backend yet.");
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    try {
      await upsertPayoutProfile(user.token, formData);
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

      {!isBackendSupported && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {supportMessage}
        </div>
      )}

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
                  disabled={!isBackendSupported}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all appearance-none text-sm"
                >
                  <option value={PayoutTransferMethod.BankAccount}>Bank Account</option>
                  <option value={PayoutTransferMethod.MobileWallet}>Mobile Wallet</option>
                  <option value={PayoutTransferMethod.Card}>Bank Card</option>
                  <option value={PayoutTransferMethod.OctoCard}>Octo Card</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {formData.transferMethod === PayoutTransferMethod.BankAccount && <Building2 className="w-5 h-5" />}
                  {formData.transferMethod === PayoutTransferMethod.MobileWallet && <Smartphone className="w-5 h-5" />}
                  {(formData.transferMethod === PayoutTransferMethod.Card || formData.transferMethod === PayoutTransferMethod.OctoCard) && <CreditCard className="w-5 h-5" />}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Transfer Type</label>
              <div className="relative">
                <select
                  name="transferType"
                  value={formData.transferType || PayoutTransferMethod.BankAccount}
                  onChange={handleChange}
                  disabled={!isBackendSupported}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all appearance-none text-sm"
                >
                  <option value={PayoutTransferType.Standard}>Standard Transfer</option>
                  <option value={PayoutTransferType.Instant}>Instant Transfer</option>
                </select>
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
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
                  disabled={!isBackendSupported}
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
                  disabled={!isBackendSupported}
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
              {formData.transferMethod === PayoutTransferMethod.BankAccount && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName || ""}
                      onChange={handleChange}
                      disabled={!isBackendSupported}
                      placeholder="e.g. CIB, NBE"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Account Number / IBAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber || ""}
                      onChange={handleChange}
                      disabled={!isBackendSupported}
                      placeholder="EG12000..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                    />
                  </div>
                </>
              )}

              {formData.transferMethod === PayoutTransferMethod.MobileWallet && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Wallet Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="recipientMobileNumber"
                    value={formData.recipientMobileNumber || ""}
                    onChange={handleChange}
                    disabled={!isBackendSupported}
                    placeholder="010..."
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
                    disabled={!isBackendSupported}
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1D6076] focus:border-[#1D6076] transition-all text-sm"
                  />
                </div>
              )}
            </motion.div>

          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving || !isBackendSupported}
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
    </div>
  );
}
