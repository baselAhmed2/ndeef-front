"use client";

import { useState, useEffect } from "react";
import { getSchedule, updateSchedule, getCapacity, updateCapacity, getClosedDates, addClosedDate, removeClosedDate } from "@/app/lib/laundry-admin-client";
import { motion } from "motion/react";
import { Clock, Save, Info, CheckCircle2 } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

type WeekSchedule = Record<string, DaySchedule>;

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

const holidayDates = [
  { date: "Apr 14, 2026", name: "National Holiday" },
  { date: "May 1, 2026", name: "Labor Day" },
  { date: "Jun 5, 2026", name: "Eid Al-Fitr" },
];

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

export function Availability() {
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);
  const [saved, setSaved] = useState(false);
  const [maxOrders, setMaxOrders] = useState(30);
  const [leadTime, setLeadTime] = useState(2);
  const [holidays, setHolidays] = useState<any[]>(holidayDates);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadAvail() {
      try {
        const [sched, cap, dates] = await Promise.all([
          getSchedule().catch(() => null),
          getCapacity().catch(() => null),
          getClosedDates().catch(() => null)
        ]);
        if (sched && Object.keys(sched).length > 0) setSchedule(sched as any);
        if (cap) {
          setMaxOrders(cap.maxOrders ?? 30);
          setLeadTime(cap.leadTime ?? 2);
        }
        if (dates && dates.length > 0) setHolidays(dates);
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    }
    loadAvail();
  }, []);

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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        updateSchedule(schedule as any),
        updateCapacity({ maxOrders, leadTime }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const hoursOpen = Object.values(schedule).filter((d) => d.enabled).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 font-semibold">Availability & Hours</h2>
          <p className="text-gray-400 text-xs mt-0.5">Set your working schedule and capacity</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
          style={{ backgroundColor: saved ? "#22c55e" : "#1D5B70" }}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Days Open", value: `${hoursOpen} / 7`, color: "#1D5B70" },
          { label: "Max Orders / Day", value: maxOrders.toString(), color: "#EBA050" },
          { label: "Lead Time", value: `${leadTime}h`, color: "#8b5cf6" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "#1D5B70" }} />
          <h3 className="font-semibold text-gray-900">Weekly Schedule</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {days.map((day, i) => {
            const dayData = schedule[day];
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 transition-all ${
                  !dayData.enabled ? "opacity-50" : ""
                }`}
              >
                {/* Day + Toggle */}
                <div className="flex items-center gap-3 sm:w-40 shrink-0">
                  <Toggle value={dayData.enabled} onChange={() => toggleDay(day)} />
                  <span className={`text-sm font-semibold ${dayData.enabled ? "text-gray-900" : "text-gray-400"}`}>
                    {day}
                  </span>
                </div>

                {/* Time Slots */}
                {dayData.enabled ? (
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    {dayData.slots.map((slot, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <select
                          value={slot.start}
                          onChange={(e) => updateSlot(day, si, "start", e.target.value)}
                          className="h-9 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
                        >
                          {timeOptions.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <span className="text-gray-400 text-xs font-medium">to</span>
                        <select
                          value={slot.end}
                          onChange={(e) => updateSlot(day, si, "end", e.target.value)}
                          className="h-9 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
                        >
                          {timeOptions.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          {(() => {
                            const [oh, om] = slot.start.split(":").map(Number);
                            const [ch, cm] = slot.end.split(":").map(Number);
                            const diff = (ch * 60 + cm) - (oh * 60 + om);
                            const h = Math.floor(diff / 60);
                            const m = diff % 60;
                            return diff > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : "â€”";
                          })()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">Closed</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Capacity Settings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Capacity Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Max Orders Per Day</label>
              <span className="text-sm font-bold" style={{ color: "#EBA050" }}>{maxOrders}</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={maxOrders}
              onChange={(e) => setMaxOrders(Number(e.target.value))}
              className="w-full accent-[#EBA050]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5</span><span>100</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Lead Time (hours)</label>
              <span className="text-sm font-bold" style={{ color: "#1D5B70" }}>{leadTime}h</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              className="w-full accent-[#1D5B70]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1h</span><span>24h</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-blue-50 px-3 py-2.5 rounded-xl">
          <Info className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
          Lead time is the minimum hours required before a new order can be placed.
        </div>
      </motion.div>

      {/* Holiday / Closed Dates */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Closed / Holiday Dates</h3>
        <div className="space-y-2 mb-4">
          {holidays.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{h.name}</p>
                <p className="text-xs text-gray-400">{h.date}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (h.id) await removeClosedDate(h.id);
                    setHolidays((prev) => prev.filter((_, idx) => idx !== i));
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                Ã—
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. May 1, 2026"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            className="flex-1 h-9 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
          />
          <input
            type="text"
            placeholder="Holiday name"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            className="flex-1 h-9 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
          />
          <button
            onClick={async () => {
              if (newHoliday.date && newHoliday.name) {
                try {
                  const added = await addClosedDate(newHoliday);
                  setHolidays((prev) => [...prev, { ...newHoliday, id: added?.id || `hol-${Date.now()}` }]);
                  setNewHoliday({ date: "", name: "" });
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            className="h-9 px-4 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#1D5B70" }}
          >
            Add
          </button>
        </div>
      </motion.div>
    </div>
  );
}

