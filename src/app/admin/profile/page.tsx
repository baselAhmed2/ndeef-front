"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { LoaderCircle, Mail, Phone, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfileRequest, type BackendUserProfileDto } from "@/app/lib/api";

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value?.trim() || "Not available"}</p>
    </div>
  );
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BackendUserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user?.token) {
        if (active) {
          setLoading(false);
          setError("No active admin session found.");
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getUserProfileRequest(user.token);
        if (!active) return;
        setProfile(result);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load admin profile.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [user?.token]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoaderCircle size={32} className="animate-spin text-[#1D6076]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-3 text-sm text-rose-700">{error || "Unable to load admin profile."}</p>
        </div>
      </div>
    );
  }

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || user?.name || "Super Admin";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SA";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Basic account details for the current super admin session.</p>
        </div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Manage Settings
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1D6076] text-2xl font-bold text-white">
            {initials}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <UserIcon className="h-5 w-5 text-[#1D6076]" />
              <h2 className="text-xl font-bold">{displayName}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <Shield className="h-3.5 w-3.5" />
                {user?.role || "SuperAdmin"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                ID: {profile.id}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="First Name" value={profile.firstName} />
          <Field label="Last Name" value={profile.lastName} />
          <Field label="Email" value={profile.email} />
          <Field label="Phone" value={profile.phone} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Mail className="h-4 w-4 text-[#1D6076]" />
              <p className="text-sm font-semibold">Primary Email</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{profile.email}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="h-4 w-4 text-[#1D6076]" />
              <p className="text-sm font-semibold">Contact Number</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{profile.phone || "Not available"}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
