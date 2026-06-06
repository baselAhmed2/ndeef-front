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
  User,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  getLaundryBillingInfo,
  getUserLaundryBillingInfo,
  type LaundryBillingInfo,
} from "@/app/lib/admin-api";

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
  const [error, setError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<LaundryBillingInfo | null>(null);

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
                This super admin page is read-only and needs a target laundry or laundry admin to load billing data.
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payout Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Billing and payout details for <span className="font-semibold text-slate-700">{billingInfo.laundryName}</span>.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Super admin can view this data from the backend billing endpoint. Editing is handled from the laundry admin side.
        </p>
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
      </motion.div>
    </div>
  );
}
