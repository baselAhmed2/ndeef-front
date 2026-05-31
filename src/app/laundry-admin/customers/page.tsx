"use client";

import { useEffect, useState } from "react";
import { getIncomingOrders } from "@/app/lib/laundry-admin-client";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { usePreferences } from "@/app/context/PreferencesContext";
import {
  CalendarClock,
  Loader2,
  PackageCheck,
  Search,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

interface CustomerRow {
  key: string;
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderStatus: string;
  services: Set<string>;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

function buildCustomers(orders: any[]): CustomerRow[] {
  const customers = new Map<string, CustomerRow>();

  for (const order of orders) {
    const phone = String(order.phone || "unknown");
    const name = String(order.customer || "Unknown Customer");
    const key = phone !== "unknown" ? phone : name.toLowerCase();
    const existing = customers.get(key);
    const createdAt = order.createdAt || "";

    if (!existing) {
      customers.set(key, {
        key,
        name,
        phone: phone === "unknown" ? "N/A" : phone,
        orders: 1,
        totalSpent: Number(order.amount || 0),
        lastOrderDate: createdAt,
        lastOrderStatus: String(order.status || "Pending"),
        services: new Set(String(order.service || "Laundry Service").split(", ")),
      });
      continue;
    }

    existing.orders += 1;
    existing.totalSpent += Number(order.amount || 0);
    String(order.service || "Laundry Service")
      .split(", ")
      .forEach((service) => existing.services.add(service));

    if (!existing.lastOrderDate || new Date(createdAt) > new Date(existing.lastOrderDate)) {
      existing.lastOrderDate = createdAt;
      existing.lastOrderStatus = String(order.status || "Pending");
    }
  }

  return Array.from(customers.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

function formatDate(value: string) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function LaundryCustomersPage() {
  const { isDark } = usePreferences();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const orders = await getIncomingOrders();
      setCustomers(buildCustomers(orders));
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not load customers.";
      setError(text);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  useAutoRefresh(() => loadCustomers(true), { intervalMs: 10000 });

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCustomers = normalizedQuery
    ? customers.filter((customer) => {
        const serviceText = Array.from(customer.services).join(" ").toLowerCase();
        return (
          customer.name.toLowerCase().includes(normalizedQuery) ||
          customer.phone.toLowerCase().includes(normalizedQuery) ||
          serviceText.includes(normalizedQuery)
        );
      })
    : customers;

  const totalOrders = customers.reduce((sum, customer) => sum + customer.orders, 0);
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const repeatCustomers = customers.filter((customer) => customer.orders > 1).length;
  const pageClass = isDark
    ? "min-h-full bg-[#071923] p-6"
    : "min-h-full bg-gradient-to-br from-[#f7fbfc] via-white to-[#fff7ed] p-6";
  const heroClass = isDark
    ? "rounded-[2rem] border border-white/10 bg-[#102231] p-6 shadow-none"
    : "rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-[#1D5B70]/5";
  const surfaceClass = isDark
    ? "rounded-2xl border border-white/10 bg-[#102231] p-5 shadow-none"
    : "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm";
  const sectionClass = isDark
    ? "rounded-[2rem] border border-white/10 bg-[#102231] p-6 shadow-none"
    : "rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm";
  const tableWrapClass = isDark
    ? "overflow-hidden rounded-3xl border border-white/10"
    : "overflow-hidden rounded-3xl border border-gray-100";
  const tableHeadClass = isDark
    ? "grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1fr_0.8fr] bg-[#132a3a] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#8db7cb]"
    : "grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1fr_0.8fr] bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-400";
  const tableRowClass = isDark
    ? "grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1fr_0.8fr] items-center border-t border-white/10 px-4 py-4 text-sm"
    : "grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1fr_0.8fr] items-center border-t border-gray-100 px-4 py-4 text-sm";

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className={heroClass}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#EBA050]">
                Customer Management
              </p>
              <h1 className={`mt-2 text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-950"}`}>
                Laundry Customers
              </h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${isDark ? "text-[#8db7cb]" : "text-gray-500"}`}>
                Built from real backend order history. Each customer is grouped by phone number
                because there is no separate laundry-customer endpoint in the backend.
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer, phone, service"
                className={`h-12 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition focus:border-[#1D5B70] focus:ring-4 focus:ring-[#1D5B70]/10 ${isDark ? "border border-white/10 bg-[#132a3a] text-white placeholder:text-[#8db7cb] focus:bg-[#193447]" : "border border-gray-200 bg-gray-50 focus:bg-white"}`}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className={surfaceClass}>
            <Users className="h-5 w-5 text-[#1D5B70]" />
            <p className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-950"}`}>{customers.length}</p>
            <p className={`text-sm ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>Unique customers</p>
          </div>
          <div className={surfaceClass}>
            <PackageCheck className="h-5 w-5 text-[#EBA050]" />
            <p className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-950"}`}>{totalOrders}</p>
            <p className={`text-sm ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>Orders represented</p>
          </div>
          <div className={surfaceClass}>
            <Wallet className="h-5 w-5 text-green-600" />
            <p className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-950"}`}>{money.format(totalRevenue)}</p>
            <p className={`text-sm ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>{repeatCustomers} repeat customers</p>
          </div>
        </div>

        <section className={sectionClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className={`font-bold ${isDark ? "text-white" : "text-gray-950"}`}>Customer List</h2>
              <p className={`text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>Derived from /laundry-admin/orders/incoming</p>
            </div>
            <UserRound className="h-5 w-5 text-[#1D5B70]" />
          </div>

          {loading ? (
            <div className={`flex h-64 items-center justify-center ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading customers...
            </div>
          ) : error ? (
            <div
              className={`rounded-3xl px-5 py-4 text-sm font-medium ${
                isDark
                  ? "border border-red-500/30 bg-red-500/10 text-red-200"
                  : "border border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className={`flex h-64 flex-col items-center justify-center rounded-3xl border text-center ${isDark ? "border-dashed border-white/10 bg-[#132a3a]" : "border-dashed border-gray-200 bg-gray-50"}`}>
              <Users className={`h-10 w-10 ${isDark ? "text-[#8db7cb]" : "text-gray-300"}`} />
              <p className={`mt-3 text-sm font-semibold ${isDark ? "text-white" : "text-gray-600"}`}>No customers found</p>
              <p className={`mt-1 text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>
                Customers will appear when backend orders are available.
              </p>
            </div>
          ) : (
            <div className={tableWrapClass}>
              <div className={tableHeadClass}>
                <span>Customer</span>
                <span>Phone</span>
                <span>Orders</span>
                <span>Spent</span>
                <span>Services</span>
                <span>Last Order</span>
              </div>
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.key}
                  className={tableRowClass}
                >
                  <div className="min-w-0">
                    <p className={`truncate font-semibold ${isDark ? "text-white" : "text-gray-950"}`}>{customer.name}</p>
                    <p className={`truncate text-xs ${isDark ? "text-[#8db7cb]" : "text-gray-400"}`}>{customer.lastOrderStatus}</p>
                  </div>
                  <span className={isDark ? "text-[#c9e0ea]" : "text-gray-600"}>{customer.phone}</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{customer.orders}</span>
                  <span className="font-bold text-[#1D5B70]">{money.format(customer.totalSpent)}</span>
                  <span className={`truncate ${isDark ? "text-[#8db7cb]" : "text-gray-500"}`}>
                    {Array.from(customer.services).slice(0, 2).join(", ")}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isDark ? "text-[#8db7cb]" : "text-gray-500"}`}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatDate(customer.lastOrderDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
