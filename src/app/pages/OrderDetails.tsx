import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, Phone, MessageCircle, Share2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { OrderStatusTracker } from '../components/OrderStatusTracker';

interface Order {
  id: string;
  laundryId: string;
  laundryName: string;
  service: string;
  itemCount: number;
  pickupDate: string;
  pickupTime: string;
  total: number;
  status: 'new' | 'in_progress' | 'ready' | 'delivered';
  createdAt: string;
}

export default function OrderDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('nadeef_orders') || '[]');
    const foundOrder = orders.find((o: Order) => o.id === id);
    setOrder(foundOrder);
  }, [id]);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Order not found</p>
      </div>
    );
  }

  const statusMessages = {
    new: 'Your order has been received and will be processed soon',
    in_progress: 'Your order is currently being processed',
    ready: 'Your order is ready for pickup or delivery',
    delivered: 'Your order has been successfully delivered',
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-20" dir="ltr">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1D6076] to-[#2a7a94] text-white px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={24} className="md:w-7 md:h-7" />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-semibold">Order Details</h1>
            <p className="text-sm md:text-base opacity-90">#{order.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Status Tracker */}
        <div className="bg-white px-4 md:px-8 lg:px-12 py-6 md:py-8 mb-4 border-b border-gray-100">
          <h2 className="font-semibold text-base md:text-xl mb-6 md:mb-8 text-center text-gray-900">Order Status</h2>
          <OrderStatusTracker currentStatus={order.status} />
          <div className="mt-4 md:mt-6 bg-[#1D6076]/10 rounded-xl p-4 md:p-5">
            <p className="text-sm md:text-base text-center text-gray-700 font-normal">
              {statusMessages[order.status]}
            </p>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white px-5 md:px-6 py-5 md:py-6 mb-4 mx-4 md:mx-8 lg:mx-12 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-base md:text-xl mb-4 md:mb-6 text-gray-900">Order Information</h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm md:text-base font-normal">Laundry</span>
              <span className="font-medium text-gray-900 text-sm md:text-base">{order.laundryName}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm md:text-base font-normal">Service</span>
              <span className="font-medium text-gray-900 text-sm md:text-base">{order.service}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm md:text-base font-normal">Items</span>
              <span className="font-medium text-gray-900 text-sm md:text-base">{order.itemCount} items</span>
            </div>
            <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm md:text-base font-normal">Pickup Time</span>
              <span className="font-medium text-gray-900 text-sm md:text-base">{order.pickupDate} • {order.pickupTime}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 md:py-3">
              <span className="text-gray-600 text-sm md:text-base font-normal">Total</span>
              <span className="font-bold text-[#1D6076] text-lg md:text-2xl">{order.total} EGP</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 md:px-8 lg:px-12 mb-4">
          <h3 className="font-semibold text-base md:text-xl mb-3 md:mb-4 text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <button className="bg-white rounded-xl p-4 md:p-6 flex flex-col items-center gap-2 md:gap-3 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <div className="w-11 h-11 md:w-14 md:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <Phone size={22} className="text-green-600 md:w-7 md:h-7" strokeWidth={2} />
              </div>
              <span className="text-xs md:text-sm font-medium text-center text-gray-700">Call Laundry</span>
            </button>
            
            <button className="bg-white rounded-xl p-4 md:p-6 flex flex-col items-center gap-2 md:gap-3 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <div className="w-11 h-11 md:w-14 md:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <MessageCircle size={22} className="text-green-600 md:w-7 md:h-7" strokeWidth={2} />
              </div>
              <span className="text-xs md:text-sm font-medium text-center text-gray-700">WhatsApp</span>
            </button>
            
            <button className="bg-white rounded-xl p-4 md:p-6 flex flex-col items-center gap-2 md:gap-3 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <div className="w-11 h-11 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center">
                <Share2 size={22} className="text-[#1D6076] md:w-7 md:h-7" strokeWidth={2} />
              </div>
              <span className="text-xs md:text-sm font-medium text-center text-gray-700">Share</span>
            </button>
          </div>
        </div>

        {/* Delivery Info */}
        {order.status === 'ready' || order.status === 'delivered' ? (
          <div className="bg-white px-5 md:px-6 py-5 md:py-6 mb-4 mx-4 md:mx-8 lg:mx-12 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-base md:text-xl mb-4 md:mb-6 text-gray-900">Delivery Information</h3>
            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-5">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-[#EBA050]/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={18} className="text-[#EBA050] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div>
                <p className="font-medium mb-1 text-gray-900 text-sm md:text-base">Delivery Address</p>
                <p className="text-sm md:text-base text-gray-600 font-normal">Home - University Street, 3rd Floor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-[#1D6076]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={18} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div>
                <p className="font-medium mb-1 text-gray-900 text-sm md:text-base">Expected Delivery Time</p>
                <p className="text-sm md:text-base text-gray-600 font-normal">{order.pickupTime}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
