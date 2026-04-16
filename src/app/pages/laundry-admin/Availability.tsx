"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addClosedDate,
  ensureLaundryProfileFromPendingOnboarding,
  getCapacity,
  getClosedDates,
  getSchedule,
  removeClosedDate,
  updateCapacity,
  updateSchedule,
} from "@/app/lib/laundry-admin-client";
import { motion } from "motion/react";
import { CheckCircle2, Clock, Info, Save } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

type WeekSchedule = Record<string, DaySchedule>;

interface ClosedDate {
  id: string;
  date: string;
  name: string;
  rawDate: string;
}

const defaultSchedule: WeekSchedule = {
  Monday: { enabled: true, slots: [{ start: "08:00", end: "20:00" }] },
  Tuesday: { enabled: true, slots: [{ start: "08:00", end: "20:00" }] },
  Wednesday: { enabled: true, slots: [{ start: "08:00", end: "20:00" }] },
  Thursday: { enabled: true, slots: [{ start: "08:00", end: "20:00" }] },
  Friday: { enabled: true, slots: [{ start: "09:00", end: "18:00" }] },
  Saturday: { enabled: true, slots: [{ start: "10:00", end: "16:00" }] },
  Sunday: { enabled: false, slots: [{ start: "10:00", end: "14:00" }] },
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const timeOptions: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    timeOptions.push(`${hh}:${mm}`);
  }
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative shrink-0 rounded-full transition-all"
      style={{
        width: 44,
        height: 24,
        backgroundColor: value ? "#1D5B70" : "#e2e8f0",
      }}
    >
      <div
        className="absolute top-0.5 rounded-full bg-white shadow transition-all"
        style={{
          width: 20,
          height: 20,
          left: value ? 22 : 2,
        }}
      />
    </button>
  );
}

function toDateInputValue(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSlotDurationLabel(slot: TimeSlot) {
  const [openHour, openMinute] = slot.start.split(":").map(Number);
  const [closeHour, closeMinute] = slot.end.split(":").map(Number);
  const diff = closeHour * 60 + closeMinute - (openHour * 60 + openMinute);

  if (diff <= 0) return "Invalid";

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
}

export function Availability() {
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [maxOrders, setMaxOrders] = useState(30);
  const [leadTime, setLeadTime] = useState(2);
  const [holidays, setHolidays] = useState<ClosedDate[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingClosedDates, setIsUpdatingClosedDates] = useState(false);

  const loadAvailability = async (allowRestore = true) => {
    try {
      setIsLoading(true);
      setSaveError("");

      const [sched, cap, dates] = await Promise.all([
        getSchedule(),
        getCapacity(),
        getClosedDates(),
      ]);

      if (allowRestore && Object.keys(sched).length === 0) {
        const restored = await ensureLaundryProfileFromPendingOnboarding();
        if (restored) {
          await loadAvailability(false);
          return;
        }
      }

      if (Object.keys(sched).length > 0) setSchedule(sched as WeekSchedule);
      setMaxOrders(cap.maxOrders ?? 30);
      setLeadTime(cap.leadTime ?? 2);
      setHolidays(dates as ClosedDate[]);
    } catch (error) {
      console.error("Failed to load availability", error);
      setSaveError(error instanceof Error ? error.message : "Failed to load availability settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAvailability();
  }, []);

  const hoursOpen = useMemo(
    () => Object.values(schedule).filter((day) => day.enabled).length,
    [schedule],
  );

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateSlot = (day: string, index: number, field: "start" | "end", value: string) => {
    setSchedule((prev) => {
      const slots = [...prev[day].slots];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const validateSchedule = () => {
    for (const day of days) {
      const slot = schedule[day].slots[0];
      if (schedule[day].enabled && slot.start >= slot.end) {
        return `${day} must have an opening time before its closing time.`;
      }
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validateSchedule();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");
      setInfoMessage("");

      await updateSchedule(schedule as any);

      try {
        await updateCapacity({ maxOrders, leadTime });
        setInfoMessage("Availability updated successfully.");
      } catch (capacityError) {
        console.error("Capacity settings failed to save", capacityError);
        setInfoMessage("Working hours were saved, but capacity settings could not be updated.");
        setSaveError(
          capacityError instanceof Error
            ? `Capacity settings could not be updated: ${capacityError.message}`
            : "Capacity settings could not be updated.",
        );
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      setSaveError(error instanceof Error ? error.message : "Failed to save availability changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClosedDate = async () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      setSaveError("Choose a date and enter a reason before adding a closed day.");
      return;
    }

    try {
      setIsUpdatingClosedDates(true);
      setSaveError("");
      setInfoMessage("");

      const added = await addClosedDate({
        date: newHoliday.date,
        name: newHoliday.name.trim(),
      });

      setHolidays((prev) => [
        ...prev,
        {
          id: String(added?.id ?? added?.Id ?? `closed-${Date.now()}`),
          date: new Date(`${newHoliday.date}T00:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          name: newHoliday.name.trim(),
          rawDate: newHoliday.date,
        },
      ]);
      setNewHoliday({ date: "", name: "" });
      setInfoMessage("Closed date added successfully.");
    } catch (error) {
      console.error(error);
      setSaveError(error instanceof Error ? error.message : "Failed to add the closed date.");
    } finally {
      setIsUpdatingClosedDates(false);
    }
  };

  const handleRemoveClosedDate = async (holiday: ClosedDate) => {
    try {
      setIsUpdatingClosedDates(true);
      setSaveError("");
      setInfoMessage("");
      await removeClosedDate(holiday.id);
      setHolidays((prev) => prev.filter((item) => item.id !== holiday.id));
      setInfoMessage("Closed date removed successfully.");
    } catch (error) {
      console.error(error);
      setSaveError(error instanceof Error ? error.message : "Failed to remove the closed date.");
    } finally {
      setIsUpdatingClosedDates(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Availability & Hours</h2>
          <p className="mt-0.5 text-xs text-gray-400">Set your working schedule and capacity</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: saved ? "#22c55e" : "#1D5B70" }}
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {saveError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}
      {infoMessage && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {infoMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Days Open", value: `${hoursOpen} / 7`, color: "#1D5B70" },
          { label: "Max Orders / Day", value: maxOrders.toString(), color: "#EBA050" },
          { label: "Lead Time", value: `${leadTime}h`, color: "#8b5cf6" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
      >
        <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-4">
          <Clock className="h-4 w-4" style={{ color: "#1D5B70" }} />
          <h3 className="font-semibold text-gray-900">Weekly Schedule</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {days.map((day, index) => {
            const dayData = schedule[day];

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className={`flex flex-col gap-4 px-5 py-4 transition-all sm:flex-row sm:items-center ${
                  !dayData.enabled ? "opacity-50" : ""
                }`}
              >
                <div className="flex shrink-0 items-center gap-3 sm:w-40">
                  <Toggle value={dayData.enabled} onChange={() => toggleDay(day)} />
                  <span className={`text-sm font-semibold ${dayData.enabled ? "text-gray-900" : "text-gray-400"}`}>
                    {day}
                  </span>
                </div>

                {dayData.enabled ? (
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    {dayData.slots.map((slot, slotIndex) => (
                      <div key={`${day}-${slotIndex}`} className="flex items-center gap-2">
                        <select
                          value={slot.start}
                          onChange={(event) => updateSlot(day, slotIndex, "start", event.target.value)}
                          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20"
                        >
                          {timeOptions.map((time) => <option key={`${day}-start-${time}`}>{time}</option>)}
                        </select>
                        <span className="text-xs font-medium text-gray-400">to</span>
                        <select
                          value={slot.end}
                          onChange={(event) => updateSlot(day, slotIndex, "end", event.target.value)}
                          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20"
                        >
                          {timeOptions.map((time) => <option key={`${day}-end-${time}`}>{time}</option>)}
                        </select>
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400">
                          {getSlotDurationLabel(slot)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs italic text-gray-400">Closed</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-gray-100 bg-white p-5"
      >
        <h3 className="mb-4 font-semibold text-gray-900">Capacity Settings</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Max Orders Per Day</label>
              <span className="text-sm font-bold" style={{ color: "#EBA050" }}>{maxOrders}</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={maxOrders}
              onChange={(event) => setMaxOrders(Number(event.target.value))}
              className="w-full accent-[#EBA050]"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>5</span>
              <span>100</span>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Lead Time (hours)</label>
              <span className="text-sm font-bold" style={{ color: "#1D5B70" }}>{leadTime}h</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={leadTime}
              onChange={(event) => setLeadTime(Number(event.target.value))}
              className="w-full accent-[#1D5B70]"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>1h</span>
              <span>24h</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
          Lead time is the minimum number of hours required before a new order can be placed.
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-2xl border border-gray-100 bg-white p-5"
      >
        <h3 className="mb-4 font-semibold text-gray-900">Closed / Holiday Dates</h3>
        <div className="mb-4 space-y-2">
          {holidays.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">
              No closed dates added yet.
            </div>
          ) : (
            holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{holiday.name}</p>
                  <p className="text-xs text-gray-400">{holiday.date}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveClosedDate(holiday)}
                  disabled={isUpdatingClosedDates}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  x
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            value={newHoliday.date}
            onChange={(event) => setNewHoliday((prev) => ({ ...prev, date: event.target.value }))}
            className="h-9 flex-1 rounded-xl border border-gray-200 px-3 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20"
          />
          <input
            type="text"
            placeholder="Holiday name"
            value={newHoliday.name}
            onChange={(event) => setNewHoliday((prev) => ({ ...prev, name: event.target.value }))}
            className="h-9 flex-1 rounded-xl border border-gray-200 px-3 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20"
          />
          <button
            type="button"
            onClick={() => void handleAddClosedDate()}
            disabled={isUpdatingClosedDates || !newHoliday.date || !newHoliday.name.trim()}
            className="h-9 rounded-xl px-4 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "#1D5B70" }}
          >
            {isUpdatingClosedDates ? "Saving..." : "Add"}
          </button>
        </div>
        {newHoliday.date && (
          <p className="mt-2 text-xs text-gray-400">
            Saving closed date for {toDateInputValue(newHoliday.date) || newHoliday.date}
          </p>
        )}
      </motion.div>

      {isLoading && (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500">
          Loading availability settings...
        </div>
      )}
    </div>
  );
}
