import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

const orders = [
  {
    id: 1,
    date: 'Mar 9, 2026',
    service: 'Wash & Fold',
    status: 'Delivered',
    total: 45.95,
    icon: '🧺',
  },
  {
    id: 2,
    date: 'Mar 2, 2026',
    service: 'Dry Cleaning',
    status: 'Delivered',
    total: 78.50,
    icon: '👔',
  },
  {
    id: 3,
    date: 'Feb 24, 2026',
    service: 'Wash & Fold',
    status: 'Delivered',
    total: 52.30,
    icon: '🧺',
  },
];

export default function OrderHistory() {
  return (
    <div className="min-h-screen bg-white" dir="ltr">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-6 md:mb-8">Order History</h1>

        <div className="space-y-3 md:space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/order-details/${order.id}`} className="block">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl md:text-3xl">{order.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium text-base md:text-lg mb-1">{order.service}</h3>
                    <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                      <Calendar size={14} className="md:w-4 md:h-4" strokeWidth={2} />
                      <span>{order.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 font-medium text-base md:text-lg mb-1">${order.total}</div>
                    <div className="text-xs md:text-sm text-green-600 bg-green-50 px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                      {order.status}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}