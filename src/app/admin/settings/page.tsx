"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import {
  Bell,
  CheckCircle2,
  Globe,
  LoaderCircle,
  Lock,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Shield,
} from "lucide-react";
import { apiRequest, ApiError } from "@/app/lib/admin-api";
import type {
  ChangePasswordPayload,
  NotificationPreferencesRecord,
  UpdateUserSettingsPayload,
  UserSettingsRecord,
} from "@/app/types/admin";

const tabs = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

const languageOptions = [
  { value: 1, label: "Arabic" },
  { value: 2, label: "English" },
];

const currencyOptions = [
  { value: 1, label: "EGP" },
  { value: 2, label: "USD" },
];

const defaultUserSettings: UserSettingsRecord = {
  language: 2,
  currency: 1,
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: false,
  showProfile: true,
  shareData: false,
};

const defaultNotificationPreferences: NotificationPreferencesRecord = {
  whatsappEnabled: false,
  smsEnabled: false,
  emailEnabled: true,
  pushEnabled: true,
  orderUpdates: true,
  promotions: false,
  newsletter: false,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("general");
  const [userSettings, setUserSettings] = useState<UserSettingsRecord>(defaultUserSettings);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferencesRecord>(defaultNotificationPreferences);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<"general" | "notifications" | "security" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      const [settingsResponse, preferencesResponse] = await Promise.all([
        apiRequest<UserSettingsRecord>("/user/settings"),
        apiRequest<NotificationPreferencesRecord>("/notifications/preferences"),
      ]);

      setUserSettings(settingsResponse);
      setNotificationPreferences(preferencesResponse);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function saveGeneralSettings() {
    try {
      setSavingSection("general");
      setError(null);
      setSuccessMessage(null);

      const payload: UpdateUserSettingsPayload = {
        language: userSettings.language,
        currency: userSettings.currency,
        pushNotifications: userSettings.pushNotifications,
        emailNotifications: userSettings.emailNotifications,
        smsNotifications: userSettings.smsNotifications,
        whatsappNotifications: userSettings.whatsappNotifications,
        showProfile: userSettings.showProfile,
        shareData: userSettings.shareData,
      };

      const response = await apiRequest<UserSettingsRecord>("/user/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setUserSettings(response);
      setSuccessMessage("General settings saved successfully.");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to save general settings.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveNotificationPreferences() {
    try {
      setSavingSection("notifications");
      setError(null);
      setSuccessMessage(null);

      const response = await apiRequest<NotificationPreferencesRecord>("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(notificationPreferences),
      });

      setNotificationPreferences(response);
      setSuccessMessage("Notification preferences saved successfully.");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to save notification preferences.");
    } finally {
      setSavingSection(null);
    }
  }

  async function savePasswordChange() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Please fill in all password fields.");
      setSuccessMessage(null);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      setSuccessMessage(null);
      return;
    }

    try {
      setSavingSection("security");
      setError(null);
      setSuccessMessage(null);

      await apiRequest("/user/change-password", {
        method: "PUT",
        body: JSON.stringify(passwordForm),
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccessMessage("Password changed successfully.");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Failed to change password.");
    } finally {
      setSavingSection(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoaderCircle size={32} className="animate-spin text-[#1D6076]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connected to `GET/PUT /api/user/settings`, `GET/PUT /api/notifications/preferences`, and `PUT /api/user/change-password`.
          </p>
        </div>
        <button
          onClick={() => void loadSettings()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {successMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-64">
          <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    active ? "text-[#1D6076]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  )}
                >
                  {active ? (
                    <motion.div
                      layoutId="settings-tab"
                      className="absolute inset-0 rounded-xl bg-[#1D6076]/5"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : null}
                  <tab.icon size={18} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          {activeTab === "general" ? (
            <div className="space-y-8">
              <div>
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Globe size={18} className="text-[#1D6076]" />
                  Account Preferences
                </h3>
                <p className="text-sm text-slate-500">Manage language, currency, and user-level preferences for your admin account.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Language</span>
                  <select
                    value={userSettings.language}
                    onChange={(event) =>
                      setUserSettings((current) => ({ ...current, language: Number(event.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1D6076]/30 focus:ring-2 focus:ring-[#1D6076]/10"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Currency</span>
                  <select
                    value={userSettings.currency}
                    onChange={(event) =>
                      setUserSettings((current) => ({ ...current, currency: Number(event.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1D6076]/30 focus:ring-2 focus:ring-[#1D6076]/10"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { key: "pushNotifications", title: "Push Notifications", description: "Enable push alerts." },
                  { key: "emailNotifications", title: "Email Notifications", description: "Enable email alerts." },
                  { key: "smsNotifications", title: "SMS Notifications", description: "Enable SMS alerts." },
                  { key: "whatsappNotifications", title: "WhatsApp Notifications", description: "Enable WhatsApp alerts." },
                  { key: "showProfile", title: "Show Profile", description: "Show your profile where supported." },
                  { key: "shareData", title: "Share Data", description: "Share usage data for product improvement." },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(userSettings[item.key as keyof UserSettingsRecord])}
                        onChange={(event) =>
                          setUserSettings((current) => ({
                            ...current,
                            [item.key]: event.target.checked,
                          }))
                        }
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-[#1D6076] peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => void saveGeneralSettings()}
                  disabled={savingSection === "general"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D6076] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1D6076]/20 transition-colors hover:bg-[#164a5c] disabled:opacity-70"
                >
                  {savingSection === "general" ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  Save General Settings
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Bell size={18} className="text-[#1D6076]" />
                  Notification Preferences
                </h3>
                <p className="text-sm text-slate-500">Manage notification delivery channels and content preferences.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { key: "pushEnabled", title: "Push Enabled", description: "Allow push notifications." },
                  { key: "emailEnabled", title: "Email Enabled", description: "Allow email notifications." },
                  { key: "smsEnabled", title: "SMS Enabled", description: "Allow SMS notifications." },
                  { key: "whatsappEnabled", title: "WhatsApp Enabled", description: "Allow WhatsApp notifications." },
                  { key: "orderUpdates", title: "Order Updates", description: "Receive order-related messages." },
                  { key: "promotions", title: "Promotions", description: "Receive offers and promos." },
                  { key: "newsletter", title: "Newsletter", description: "Receive newsletters." },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(notificationPreferences[item.key as keyof NotificationPreferencesRecord])}
                        onChange={(event) =>
                          setNotificationPreferences((current) => ({
                            ...current,
                            [item.key]: event.target.checked,
                          }))
                        }
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-[#1D6076] peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => void saveNotificationPreferences()}
                  disabled={savingSection === "notifications"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D6076] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1D6076]/20 transition-colors hover:bg-[#164a5c] disabled:opacity-70"
                >
                  {savingSection === "notifications" ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Notification Preferences
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Lock size={18} className="text-[#1D6076]" />
                  Change Password
                </h3>
                <p className="text-sm text-slate-500">Update your current admin account password securely.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Current Password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#1D6076]/30 focus:ring-2 focus:ring-[#1D6076]/10"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">New Password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#1D6076]/30 focus:ring-2 focus:ring-[#1D6076]/10"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Confirm New Password</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#1D6076]/30 focus:ring-2 focus:ring-[#1D6076]/10"
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => void savePasswordChange()}
                  disabled={savingSection === "security"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D6076] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1D6076]/20 transition-colors hover:bg-[#164a5c] disabled:opacity-70"
                >
                  {savingSection === "security" ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  Update Password
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
