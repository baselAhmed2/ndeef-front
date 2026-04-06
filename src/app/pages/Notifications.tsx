import { Bell, Package, CheckCircle, Truck, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';

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

const notifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    icon: 'check',
    title: 'Your order is ready!',
    message: 'Your order from Smart Clean Laundry is ready for pickup',
    time: '5 minutes ago',
    read: false,
    orderId: '1001',
  },
  {
    id: '2',
    type: 'promo',
    icon: 'bell',
    title: 'Special Offer',
    message: 'Get 30 EGP off on your next order',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'order',
    icon: 'truck',
    title: 'On the way',
    message: 'Driver is on the way to deliver your order',
    time: '3 hours ago',
    read: true,
    orderId: '1002',
  },
  {
    id: '4',
    type: 'order',
    icon: 'package',
    title: 'Order processing started',
    message: 'Laundry started working on your order',
    time: '5 hours ago',
    read: true,
    orderId: '1001',
  },
];

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

export default function Notifications() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-20">
      <TopBar title="Notifications" showSearch={false} />

      {/* Header Stats */}
      <div className="bg-white px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            You have <span className="font-semibold text-[#1D6076]">{unreadCount}</span> new notifications
          </p>
          <button className="text-sm text-[#1D6076] font-medium">
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-5 py-4 space-y-3">
        {notifications.map((notification) => {
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
