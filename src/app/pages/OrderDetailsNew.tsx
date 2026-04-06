import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function OrderDetailsNew() {
  const [showReschedule, setShowReschedule] = useState(false);

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header - Teal */}
      <div className="bg-[#1D6076] px-5 py-4">
        <Link href="/" className="inline-block mb-4">
          <ArrowLeft size={24} className="text-white" strokeWidth={2} />
        </Link>
        <h1 className="text-white text-base tracking-wider">DELIVERY INFO</h1>
      </div>

      {/* Delivery Summary Card */}
      <div className="mx-5 mt-6 mb-6">
        <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Mar</div>
            <div className="text-3xl font-medium text-gray-900">9</div>
            <div className="text-sm text-gray-500">Mon</div>
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-medium mb-1">Wash & Fold</h3>
          </div>
          <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🧺</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-2">
          <span className="text-sm text-gray-600">Add Next-Day Rush Service</span>
          <div className="flex items-center gap-2">
            <span className="text-[#1D6076] text-sm font-medium">$9.95</span>
            <label className="relative inline-block w-12 h-6">
              <input type="checkbox" className="peer sr-only" />
              <span className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#EBA050] transition-colors cursor-pointer"></span>
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 mb-6">
        <div className="relative">
          {/* Pickup Info */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-20 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Pickup Info</h3>
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Add your payment details</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Link a credit card to activate your account and schedule your first pickup.
                  </p>
                  <Link href="/billing" className="bg-[#EBA050] text-white px-6 py-2 rounded-lg text-sm font-medium inline-block hover:bg-[#EBA050]/90 transition-colors">
                    Add payment method
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Wash & Fold */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Wash & Fold</h3>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700 mb-2">Bag pickup (2)</p>
                  <p className="text-xs text-gray-500">
                    Your Valet will bring 2 free personalized Rinse bags to put your items in on pickup day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Item: Wash & Fold */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Item: Wash & Fold</h3>
                <p className="text-sm text-gray-600 mb-2">No items yet</p>
                <button className="text-[#1D6076] text-sm font-medium border border-[#1D6076] px-4 py-2 rounded-lg hover:bg-[#1D6076]/5 transition-colors">
                  Add items
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Preferences</h3>
                <p className="text-sm text-gray-600 mb-2">Set your laundry preferences</p>
                <button className="text-[#1D6076] text-sm font-medium border border-[#1D6076] px-4 py-2 rounded-lg hover:bg-[#1D6076]/5 transition-colors">
                  Update Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Sign the card */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Sign the card</h3>
                <p className="text-sm text-gray-600 mb-2">
                  When we bring your Rinse bags on pickup day, you&apos;ll get a card to help you communicate with your Valet.
                </p>
              </div>
            </div>
          </div>

          {/* Valet will text you */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Valet will text you</h3>
                <p className="text-sm text-gray-600">
                  On the day of pickup, at 5:30pm we&apos;ll text you with a 30-minute arrival window.
                </p>
              </div>
            </div>
          </div>

          {/* Leave a bag */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Leave a bag or wait</h3>
                <p className="text-sm text-gray-600">
                  If you&apos;re not around, you can leave your bag in a safe place at your door. Or just hang out — your Valet is on their way!
                </p>
              </div>
            </div>
          </div>

          {/* Receive and inspect */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">Receive and inspect</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Our team will carefully inspect and clean each item according to your preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Item list */}
          <div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 font-medium mb-1">
                  Have a large amount of clothes or linens?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  If you need 4 or more Rinse bags, you&apos;ll need to order them ahead of time. This will give us time to make more personalized bags.
                </p>
                <button className="bg-[#EBA050] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#EBA050]/90 transition-colors">
                  More bags - $2
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Info Footer */}
      <div className="mx-5 mb-6">
        <div className="bg-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Mar</div>
              <div className="text-3xl font-medium text-gray-900">9</div>
              <div className="text-sm text-gray-500">Mon</div>
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 font-medium mb-1">Wash & Fold</h3>
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🧺</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Get it delivered by <span className="font-medium">tomorrow 10pm</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-6 space-y-3">
        <button 
          onClick={() => setShowReschedule(true)}
          className="w-full bg-white border border-gray-300 text-gray-900 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button className="w-full bg-white border border-gray-300 text-gray-900 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          Contact Rinse
        </button>
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900 font-medium">Reschedule your pickup</h2>
              <button onClick={() => setShowReschedule(false)}>
                <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-900 tracking-wider mb-4">CHOOSE YOUR PICKUP DATE:</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="border-2 border-[#EBA050] rounded-2xl p-6 text-center">
                  <div className="text-sm text-gray-500 mb-2">March</div>
                  <div className="text-4xl font-medium text-gray-900 mb-2">8</div>
                  <div className="text-sm text-gray-500">Tonight</div>
                </button>
                <button className="border border-gray-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center hover:border-gray-300 transition-colors">
                  <Calendar size={32} className="text-gray-400 mb-2" strokeWidth={1.5} />
                  <div className="text-sm text-gray-700">Other date</div>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-900 tracking-wider mb-4">YOUR DELIVERY IS SCHEDULED FOR:</h3>
              <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Mar</div>
                  <div className="text-3xl font-medium text-gray-900">9</div>
                  <div className="text-sm text-gray-500">Mon</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 font-medium mb-1">Wash & Fold</h3>
                </div>
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🧺</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#EBA050] text-white py-4 rounded-xl font-medium hover:bg-[#EBA050]/90 transition-colors">
              Confirm pickup reschedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
