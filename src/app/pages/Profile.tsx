"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { useAuth } from "../context/AuthContext";
import {
  addUserAddressRequest,
  changePasswordRequest,
  deleteAccountRequest,
  getUserAddressesRequest,
  getUserProfileRequest,
  updateUserAddressRequest,
  updateUserProfileRequest,
} from "../lib/api";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apt: string;
  instructions: string;
};

const EMPTY_FORM: ProfileFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  apt: "",
  instructions: "",
};

function splitAddress(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { street: "", area: "Unknown", city: "Unknown" };
  }

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  const street = parts[0] ?? trimmed;
  const area = parts[1] ?? "Unknown";
  const city = parts[2] ?? parts[1] ?? "Unknown";
  return { street, area, city };
}

export default function Profile() {
  const router = useRouter();
  const { user, isAuthReady, updateUser, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProfileFormState>(EMPTY_FORM);

  const isLoggedOut = isAuthReady && !user?.token;

  const initialFallback = useMemo(
    () => ({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  );

  useEffect(() => {
    if (!isAuthReady) return;
    const token = user?.token ?? null;
    if (!token) {
      setLoading(false);
      return;
    }
    const authToken: string = token;

    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const [profile, addresses] = await Promise.all([
          getUserProfileRequest(authToken),
          getUserAddressesRequest(authToken).catch(() => []),
        ]);

        if (!active) return;

        const primaryAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

        setAddressId(primaryAddress?.id ?? null);
        setFormData({
          firstName: profile.firstName ?? "",
          lastName: profile.lastName ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          address: primaryAddress?.street ?? "",
          apt: primaryAddress?.apt ?? "",
          instructions: primaryAddress?.instructions ?? "",
        });
      } catch (error) {
        if (!active) return;

        setFormData((current) => ({
          ...current,
          ...initialFallback,
        }));
        toast.error(error instanceof Error ? error.message : "Failed to load profile.");
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
  }, [initialFallback, isAuthReady, user]);

  const handleSaveProfile = async () => {
    if (!user?.token) {
      toast.error("You need to log in first.");
      return;
    }

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();

    if (!firstName || !lastName || !email) {
      toast.error("First name, last name, and email are required.");
      return;
    }

    try {
      setSaving(true);

      await updateUserProfileRequest(user.token, {
        firstName,
        lastName,
        email,
        phone: formData.phone.trim(),
      });

      const trimmedAddress = formData.address.trim();
      if (trimmedAddress) {
        const parts = splitAddress(trimmedAddress);
        const addressPayload = {
          type: "Home",
          label: "Home",
          street: parts.street,
          apt: formData.apt.trim() || null,
          city: parts.city,
          area: parts.area,
          instructions: formData.instructions.trim() || null,
          isDefault: true,
        };

        const savedAddress = addressId
          ? await updateUserAddressRequest(user.token, addressId, addressPayload)
          : await addUserAddressRequest(user.token, addressPayload);

        setAddressId(savedAddress.id);
      }

      updateUser({
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        phone: formData.phone.trim(),
      });

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!user?.token) {
      throw new Error("You need to log in first.");
    }

    await changePasswordRequest(user.token, payload);
    toast.success("Password updated successfully.");
  };

  const handleDeleteAccount = async () => {
    if (!user?.token || deleting) {
      return;
    }

    const password = window.prompt("Please enter your password to delete the account.");
    if (!password) {
      return;
    }

    const reason = window.prompt("Optional: why are you leaving?") ?? "";

    try {
      setDeleting(true);
      await deleteAccountRequest(user.token, {
        password,
        reason: reason.trim() || undefined,
      });
      toast.success("Account deleted successfully.");
      logout();
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1D6076]" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (isLoggedOut) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-gray-900 text-lg font-semibold">Please log in to view your profile.</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-4 rounded-xl bg-[#1D6076] px-4 py-3 text-white font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="hover:opacity-70 transition-opacity">
            <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
          </button>
          <h1 className="text-xs font-bold text-gray-900 tracking-wider absolute left-1/2 transform -translate-x-1/2">
            PROFILE
          </h1>
          <button
            onClick={() => void handleSaveProfile()}
            disabled={saving}
            className="text-sm font-medium text-[#1D6076] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
          <div>
            <label className="text-gray-400 text-sm md:text-base mb-2 block">First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm md:text-base mb-2 block">Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
            />
          </div>
        </div>

        <div className="mb-4 md:mb-5">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
          />
        </div>

        <div className="mb-8 md:mb-12">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Phone number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
          />
        </div>

        <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">ADDRESS</h2>

        <div className="mb-4 md:mb-5">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
          />
        </div>

        <div className="mb-4 md:mb-5">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Apt # (Optional)</label>
          <input
            type="text"
            value={formData.apt}
            onChange={(e) => setFormData({ ...formData, apt: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076] placeholder-gray-300"
          />
        </div>

        <div className="mb-8 md:mb-12">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Address instructions</label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={3}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076] placeholder-gray-300 resize-none"
          />
        </div>

        <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">ACCOUNT HELP</h2>

        <div className="space-y-4 md:space-y-5">
          <button
            onClick={() => setShowChangePassword(true)}
            className="text-[#EBA050] text-base md:text-lg font-medium hover:underline"
          >
            Change password
          </button>
          <br />
          <button
            onClick={() => void handleDeleteAccount()}
            disabled={deleting}
            className="text-[#EBA050] text-base md:text-lg font-medium hover:underline disabled:opacity-60"
          >
            {deleting ? "Deleting account..." : "Request account deletion"}
          </button>
        </div>

        <div className="h-20"></div>
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
