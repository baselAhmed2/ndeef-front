"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Heart,
  Loader2,
  MapPin,
  Shield,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { useAuth } from "../context/AuthContext";
import {
  addUserAddressRequest,
  changePasswordRequest,
  deleteAccountRequest,
  deleteUserAddressRequest,
  getUserAddressesRequest,
  getUserFavoritesRequest,
  getUserPointsRequest,
  getUserProfileRequest,
  getUserStatsRequest,
  redeemUserPointsRequest,
  removeUserFavoriteRequest,
  setDefaultUserAddressRequest,
  updateUserAddressRequest,
  updateUserProfileRequest,
  uploadUserAvatarRequest,
  type BackendAddressDto,
  type BackendFavoriteLaundryDto,
  type BackendUserPointsDto,
  type BackendUserStatsDto,
} from "../lib/api";

type ProfileSectionKey =
  | "stats"
  | "addresses"
  | "favorites"
  | "points";

type ProfileSectionErrors = Partial<Record<ProfileSectionKey, string>>;

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
  return {
    street: parts[0] ?? trimmed,
    area: parts[1] ?? "Unknown",
    city: parts[2] ?? parts[1] ?? "Unknown",
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Star;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, isAuthReady, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<BackendAddressDto[]>([]);
  const [favorites, setFavorites] = useState<BackendFavoriteLaundryDto[]>([]);
  const [points, setPoints] = useState<BackendUserPointsDto>({ totalPoints: 0, history: [] });
  const [stats, setStats] = useState<BackendUserStatsDto | null>(null);
  const [formData, setFormData] = useState<ProfileFormState>(EMPTY_FORM);
  const [sectionErrors, setSectionErrors] = useState<ProfileSectionErrors>({});

  const isLoggedOut = isAuthReady && !user?.token;

  const displayName = useMemo(() => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    return fullName || user?.name || "Nazeef User";
  }, [formData.firstName, formData.lastName, user?.name]);

  const avatarInitials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "NU";
  }, [displayName]);

  useEffect(() => {
    if (!isAuthReady) return;
    const token = user?.token ?? null;
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    const authToken = token;

    async function loadProfile() {
      try {
        setLoading(true);
        setSectionErrors({});

        const profile = await getUserProfileRequest(authToken);
        const [
          addressesResult,
          statsResult,
          favoritesResult,
          pointsResult,
        ] = await Promise.allSettled([
          getUserAddressesRequest(authToken),
          getUserStatsRequest(authToken),
          getUserFavoritesRequest(authToken),
          getUserPointsRequest(authToken),
        ]);

        if (!active) return;

        const nextErrors: ProfileSectionErrors = {};
        const loadedAddresses =
          addressesResult.status === "fulfilled" ? addressesResult.value : [];
        const loadedStats =
          statsResult.status === "fulfilled" ? statsResult.value : null;
        const loadedFavorites =
          favoritesResult.status === "fulfilled" ? favoritesResult.value : [];
        const loadedPoints =
          pointsResult.status === "fulfilled"
            ? pointsResult.value
            : { totalPoints: 0, history: [] };

        if (addressesResult.status === "rejected") {
          nextErrors.addresses =
            addressesResult.reason instanceof Error
              ? addressesResult.reason.message
              : "Could not load your addresses right now.";
        }

        if (statsResult.status === "rejected") {
          nextErrors.stats =
            statsResult.reason instanceof Error
              ? statsResult.reason.message
              : "Could not load your account stats right now.";
        }

        if (favoritesResult.status === "rejected") {
          nextErrors.favorites =
            favoritesResult.reason instanceof Error
              ? favoritesResult.reason.message
              : "Could not load your favorites right now.";
        }

        if (pointsResult.status === "rejected") {
          nextErrors.points =
            pointsResult.reason instanceof Error
              ? pointsResult.reason.message
              : "Could not load your points right now.";
        }

        const primaryAddress =
          loadedAddresses.find((address) => address.isDefault) ?? loadedAddresses[0] ?? null;

        setAddresses(loadedAddresses);
        setAddressId(primaryAddress?.id ?? null);
        setStats(loadedStats);
        setFavorites(loadedFavorites);
        setPoints(loadedPoints);
        setAvatarUrl(profile.avatarUrl ?? null);
        setSectionErrors(nextErrors);
        updateUser({ avatarUrl: profile.avatarUrl ?? null });
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
  }, [isAuthReady, updateUser, user?.token]);

  const refreshAddresses = async () => {
    if (!user?.token) return;
    const loadedAddresses = await getUserAddressesRequest(user.token);
    const primaryAddress =
      loadedAddresses.find((address) => address.isDefault) ?? loadedAddresses[0] ?? null;
    setAddresses(loadedAddresses);
    setAddressId(primaryAddress?.id ?? null);
    setSectionErrors((current) => ({ ...current, addresses: undefined }));
  };

  const refreshFavorites = async () => {
    if (!user?.token) return;
    setFavorites(await getUserFavoritesRequest(user.token));
    setSectionErrors((current) => ({ ...current, favorites: undefined }));
  };

  const refreshPoints = async () => {
    if (!user?.token) return;
    setPoints(await getUserPointsRequest(user.token));
    setSectionErrors((current) => ({ ...current, points: undefined }));
  };

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

        if (addressId) {
          await updateUserAddressRequest(user.token, addressId, addressPayload);
        } else {
          await addUserAddressRequest(user.token, addressPayload);
        }

        await refreshAddresses();
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

  const handleAvatarSelect = async (file: File | null) => {
    if (!user?.token || !file) return;

    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadUserAvatarRequest(user.token, formData);
      const nextAvatar = response.avatarUrl ?? response.AvatarUrl ?? null;
      setAvatarUrl(nextAvatar);
      updateUser({ avatarUrl: nextAvatar });
      toast.success("Avatar updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAddressDelete = async (id: number) => {
    if (!user?.token) return;
    try {
      await deleteUserAddressRequest(user.token, id);
      await refreshAddresses();
      toast.success("Address deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete address.");
    }
  };

  const handleAddressDefault = async (id: number) => {
    if (!user?.token) return;
    try {
      await setDefaultUserAddressRequest(user.token, id);
      await refreshAddresses();
      toast.success("Default address updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update default address.");
    }
  };

  const handleFavoriteRemove = async (laundryId: number) => {
    if (!user?.token) return;
    try {
      await removeUserFavoriteRequest(user.token, laundryId);
      await refreshFavorites();
      toast.success("Removed from favorites.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update favorites.");
    }
  };

  const handleRedeemPoints = async () => {
    if (!user?.token) return;

    const rawPoints = window.prompt("How many points do you want to redeem?");
    if (!rawPoints) return;
    const pointsToRedeem = Number(rawPoints);
    if (!Number.isFinite(pointsToRedeem) || pointsToRedeem <= 0) {
      toast.error("Enter a valid number of points.");
      return;
    }

    const rewardId = window.prompt("Reward ID")?.trim() || "profile-reward";

    try {
      await redeemUserPointsRequest(user.token, {
        points: pointsToRedeem,
        rewardId,
      });
      await refreshPoints();
      toast.success("Points redeemed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to redeem points.");
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
    if (!user?.token || deleting) return;

    const password = window.prompt("Please enter your password to delete the account.");
    if (!password) return;
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
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1D6076]" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (isLoggedOut) {
    return (
      <div className="ndeef-page-shell min-h-screen bg-[#f8fafc] flex items-center justify-center px-6 text-center">
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
    <div className="ndeef-page-shell min-h-screen bg-[#f8fafc]" dir="ltr">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => void handleAvatarSelect(event.target.files?.[0] ?? null)}
      />

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100">
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer Account</p>
            <h1 className="text-lg font-bold text-slate-950">Profile</h1>
          </div>
          <button
            onClick={() => void handleSaveProfile()}
            disabled={saving}
            className="rounded-xl bg-[#1D6076] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#174d5f] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#0d3d50_0%,#1D6076_58%,#2a7a94_100%)] p-6 text-white shadow-[0_22px_70px_rgba(13,61,80,0.22)] sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/15 bg-white/15 text-2xl font-bold text-white backdrop-blur-sm"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                )}
                <span className="absolute bottom-2 right-2 rounded-xl bg-[#EBA050] p-1.5 text-white shadow-lg">
                  {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </span>
              </button>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
                <p className="mt-1 text-sm text-white/80">{formData.email || user?.email}</p>
                <p className="text-sm text-white/70">{formData.phone || "No phone number yet"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Points</p>
                <p className="mt-1 text-2xl font-bold">{points.totalPoints}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Favorites</p>
                <p className="mt-1 text-2xl font-bold">{favorites.length}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Addresses</p>
                <p className="mt-1 text-2xl font-bold">{addresses.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Completed orders" value={String(stats?.completedOrders ?? 0)} icon={Shield} tone="bg-[#1D6076]/10 text-[#1D6076]" />
          <StatCard label="Active orders" value={String(stats?.activeOrders ?? 0)} icon={Star} tone="bg-[#EBA050]/10 text-[#EBA050]" />
          <StatCard label="Total spent" value={formatMoney(Number(stats?.totalSpent ?? 0))} icon={Wallet} tone="bg-emerald-50 text-emerald-600" />
          <StatCard label="Reward points" value={String(points.totalPoints ?? 0)} icon={Star} tone="bg-amber-50 text-amber-600" />
        </div>
        {sectionErrors.stats ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Stats are unavailable right now: {sectionErrors.stats}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Personal information</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-500">First name</label>
                  <input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Last name</label>
                  <input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Phone number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Addresses</h3>
                  <p className="text-sm text-slate-500">Your saved addresses appear here.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Primary street</label>
                  <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Apartment</label>
                  <input value={formData.apt} onChange={(e) => setFormData({ ...formData, apt: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-500">Instructions</label>
                  <textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={3} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#1D6076]" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {sectionErrors.addresses ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Addresses are unavailable right now: {sectionErrors.addresses}
                  </div>
                ) : null}
                {!sectionErrors.addresses && addresses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No saved addresses yet.
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div key={address.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#1D6076]" />
                          <p className="font-semibold text-slate-900">{address.label || address.type}</p>
                          {address.isDefault ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Default</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {[address.street, address.apt, address.area, address.city].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!address.isDefault ? (
                          <button onClick={() => void handleAddressDefault(address.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                            Make default
                          </button>
                        ) : null}
                        <button onClick={() => void handleAddressDelete(address.id)} className="rounded-xl border border-red-200 bg-white p-2 text-red-500 transition hover:bg-red-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Favorites</h3>
                  <p className="text-sm text-slate-500">Your favorite laundries appear here.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {sectionErrors.favorites ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Favorites are unavailable right now: {sectionErrors.favorites}
                  </div>
                ) : null}
                {!sectionErrors.favorites && favorites.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    You have no favorite laundries yet.
                  </div>
                ) : (
                  favorites.map((favorite) => (
                    <div key={favorite.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{favorite.laundryName}</p>
                        <p className="mt-1 text-sm text-slate-500">{favorite.laundryAddress}</p>
                        <p className="mt-1 text-xs text-slate-400">Added {formatDate(favorite.addedAt)} • Rating {Number(favorite.averageRating ?? 0).toFixed(1)}</p>
                      </div>
                      <button onClick={() => void handleFavoriteRemove(favorite.laundryId)} className="rounded-xl border border-red-200 bg-white p-2 text-red-500 transition hover:bg-red-50">
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Points & rewards</h3>
                  <p className="text-sm text-slate-500">Your points balance and recent activity.</p>
                </div>
                <button onClick={() => void handleRedeemPoints()} className="rounded-xl bg-[#EBA050] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90">
                  Redeem
                </button>
              </div>

              <div className="mt-5 rounded-[28px] bg-[linear-gradient(145deg,#0d3d50_0%,#1D6076_58%,#2a7a94_100%)] p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Current points</p>
                <p className="mt-2 text-4xl font-black">{points.totalPoints}</p>
                <p className="mt-2 text-sm text-white/75">Redeem them toward future orders when rewards are available.</p>
              </div>

              <div className="mt-4 space-y-3">
                {sectionErrors.points ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Points are unavailable right now: {sectionErrors.points}
                  </div>
                ) : null}
                {!sectionErrors.points && points.history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No points history returned yet.
                  </div>
                ) : (
                  points.history.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{transaction.description}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <span className={`text-sm font-bold ${String(transaction.type).toLowerCase().includes("redeem") ? "text-red-500" : "text-emerald-600"}`}>
                        {String(transaction.type).toLowerCase().includes("redeem") ? "-" : "+"}
                        {transaction.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Account help</h3>
              <div className="mt-5 space-y-3">
                <button onClick={() => setShowChangePassword(true)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#1D6076] transition hover:bg-slate-100">
                  Change password
                </button>
                <button onClick={() => void handleDeleteAccount()} disabled={deleting} className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60">
                  {deleting ? "Deleting account..." : "Request account deletion"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
