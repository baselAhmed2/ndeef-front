"use client";

import { useEffect, useState } from 'react';
import { Bell, Package, CheckCircle, Truck, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { apiRequest } from '../lib/admin-api';

interface Notification {
  id: string;
  type: 'order' | 'promo' | 'general';
  icon: 'package' | 'check' | 'truck' | 'bell';
  title: string;
  message: string;
  time: string;
  read: boolean;
  orderId?: string;
}

type BackendNotification = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  type?: string | number | null;
  isRead?: boolean | null;
  orderId?: number | string | null;
  createdAt?: string | null;
};

type NotificationResponse = BackendNotification[] | { data?: BackendNotification[] | null };

const iconMap = {
  package: Package,
  check: CheckCircle,
  truck: Truck,
  bell: Bell,
};

const colorConfig = {
  package: { bg: 'bg-[#1D6076]/10', text: 'text-[#1D6076]' },
  check: { bg: 'bg-green-50', text: 'text-green-600' },
  truck: { bg: 'bg-[#EBA050]/10', text: 'text-[#EBA050]' },
  bell: { bg: 'bg-purple-50', text: 'text-purple-600' },
};

function formatTimeAgo(isoString?: string | null) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function mapIcon(type: string | number | null | undefined): Notification['icon'] {
  const normalized = String(type ?? '').toLowerCase();
  if (normalized.includes('delivered') || normalized === '3') return 'check';
  if (normalized.includes('confirmed') || normalized.includes('created') || normalized.includes('order') || ['1', '2'].includes(normalized)) {
    return 'package';
  }
  if (normalized.includes('payment') || normalized === '4') return 'bell';
  return 'bell';
}

function mapType(type: string | number | null | undefined): Notification['type'] {
  const normalized = String(type ?? '').toLowerCase();
  if (normalized.includes('promotion') || normalized === '5') return 'promo';
  if (normalized.includes('order') || ['1', '2', '3'].includes(normalized)) return 'order';
  return 'general';
}

function unwrapNotifications(payload: NotificationResponse) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

function mapNotification(notification: BackendNotification): Notification {
  return {
    id: String(notification.id),
    type: mapType(notification.type),
    icon: mapIcon(notification.type),
    title: notification.title ?? 'Notification',
    message: notification.message ?? '',
    time: formatTimeAgo(notification.createdAt),
    read: Boolean(notification.isRead),
    orderId: notification.orderId == null ? undefined : String(notification.orderId),
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError(null);
        const payload = await apiRequest<NotificationResponse>('/notifications?PageIndex=1&PageSize=50');
        if (active) setNotifications(unwrapNotifications(payload).map(mapNotification));
      } catch (error) {
        console.error('Failed to load notifications', error);
        if (active) {
          setNotifications([]);
          setError('Failed to load notifications from backend.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const markAllRead = async () => {
    try {
      setError(null);
      await apiRequest('/notifications/mark-all-read', { method: 'PUT' });
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
      setError('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-20">
      <TopBar title="Notifications" showSearch={false} />

      {/* Header Stats */}
      <div className="bg-white px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            You have <span className="font-semibold text-[#1D6076]">{unreadCount}</span> new notifications
          </p>
          <button onClick={() => void markAllRead()} className="text-sm text-[#1D6076] font-medium">
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-5 py-4 space-y-3">
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="mb-3 animate-spin" size={28} />
            <p className="text-sm">Loading notifications...</p>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-gray-400">
            <Bell className="mb-3 opacity-50" size={32} />
            <p className="text-sm font-medium">No notifications found</p>
          </div>
        )}

        {!loading && notifications.map((notification) => {
          const Icon = iconMap[notification.icon];
          const color = colorConfig[notification.icon];

          return (
            <div
              key={notification.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm border transition-all duration-200 ${
                !notification.read ? 'border-[#1D6076]/30' : 'border-gray-100'
              }`}
            >
              <Link href={notification.orderId ? `/orders` : '#'}
                className="flex items-start gap-3.5 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}>
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900">{notification.title}</h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#1D6076] rounded-full shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1 font-normal">{notification.message}</p>
                  <p className="text-xs text-gray-400 font-normal">{notification.time}</p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* WhatsApp & SMS Info */}
      <div className="px-5 mb-4">
        <div className="bg-gradient-to-br from-[#1D6076] to-[#2a7a94] rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare size={22} strokeWidth={2} />
            <h3 className="font-semibold text-base">WhatsApp & SMS Notifications</h3>
          </div>
          <p className="text-sm opacity-90 mb-3 font-normal">
            Get instant updates about your orders via WhatsApp and SMS
          </p>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
              <CheckCircle size={16} strokeWidth={2} />
              <span className="text-xs font-medium">WhatsApp Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
              <CheckCircle size={16} strokeWidth={2} />
              <span className="text-xs font-medium">SMS Active</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
