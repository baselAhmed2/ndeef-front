import Link from 'next/link';
import { ArrowLeft, Truck, Calendar as CalendarIcon } from 'lucide-react';

export default function Schedule() {
  return (
    <div className="min-h-screen bg-white pb-40" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl text-gray-900 mb-8 md:mb-10">Schedule your order</h1>

        {/* Pickup Section */}
        <div className="mb-8 md:mb-12 max-w-3xl">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">Pickup</h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
            All pickups are between 8pm and 10pm. At 5:30pm, we&apos;ll text you a 30-minute arrival window of your Valet, who will bring your free personalized Rinse bags.
          </p>

          {/* Pickup Card */}
          <div className="border-2 border-[#EBA050] rounded-2xl p-5 md:p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <Truck size={28} className="text-gray-900 md:w-8 md:h-8" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Pickup</div>
                  <div className="text-lg md:text-xl font-medium text-gray-900">Tonight, Mar 8</div>
                </div>
              </div>
              <button className="text-[#EBA050] text-sm md:text-base font-medium hover:underline">
                Edit
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 md:p-5">
              <p className="text-gray-900 text-sm md:text-base mb-2">Not available in the evening?</p>
              <p className="text-gray-600 text-sm md:text-base">
                No sweat - activate Rinse Drop for pickup and delivery without your presence on the next page.
              </p>
            </div>
          </div>

          <div className="text-[#EBA050] text-sm md:text-base font-medium">
            14:00:21 left for a pickup tonight!
          </div>
        </div>

        {/* Services & Delivery Section */}
        <div className="max-w-3xl">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-6">Services & delivery</h2>

          {/* Wash & Fold - Added */}
          <div className="border-2 border-[#EBA050] rounded-2xl p-5 md:p-6 mb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">🧺</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg md:text-xl font-medium text-gray-900">Wash & Fold</h3>
                  <span className="bg-[#EBA050] text-white text-xs md:text-sm font-medium px-3 py-1 rounded-full">
                    Added
                  </span>
                </div>

                <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 md:p-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                    <Truck size={24} className="text-gray-700 md:w-7 md:h-7" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery</div>
                        <div className="text-base md:text-lg font-medium text-gray-900">Tomorrow, Mar 9</div>
                        <div className="text-sm md:text-base text-gray-600 mt-1">
                          NEXT-DAY <span className="font-medium">$39.95</span>
                        </div>
                      </div>
                      <button className="text-[#EBA050] text-sm md:text-base font-medium hover:underline ml-4">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dry Cleaning */}
          <div className="border border-gray-200 rounded-2xl p-5 md:p-6 mb-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👔</span>
                </div>
                <h3 className="text-lg md:text-xl font-medium text-gray-900">Dry Cleaning</h3>
              </div>
              <button className="text-[#EBA050] text-sm md:text-base font-medium border border-[#EBA050] px-4 py-2 md:px-6 md:py-2.5 rounded-full hover:bg-[#EBA050] hover:text-white transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* Hang Dry */}
          <div className="border border-gray-200 rounded-2xl p-5 md:p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👕</span>
                </div>
                <h3 className="text-lg md:text-xl font-medium text-gray-900">Hang Dry</h3>
              </div>
              <button className="text-[#EBA050] text-sm md:text-base font-medium border border-[#EBA050] px-4 py-2 md:px-6 md:py-2.5 rounded-full hover:bg-[#EBA050] hover:text-white transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-8 lg:px-12 py-5 md:py-6 z-20">
        <div className="max-w-7xl mx-auto">
          {/* Schedule Button */}
          <Link href="/order-details/1">
            <button className="w-full bg-[#EBA050] text-white py-4 md:py-5 rounded-xl font-medium text-base md:text-lg mb-4 hover:bg-[#EBA050]/90 transition-colors shadow-lg">
              Schedule my order
            </button>
          </Link>

          {/* Info Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-[#1D6076] shrink-0" strokeWidth={2} />
              <span className="text-gray-600 text-sm md:text-base">Reschedule or cancel anytime.</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#1D6076] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
              </svg>
              <span className="text-gray-600 text-sm md:text-base">
                Satisfaction <span className="text-[#EBA050] font-medium">guaranteed</span>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
