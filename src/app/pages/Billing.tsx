import Link from 'next/link';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { useState } from 'react';

export default function Billing() {
  const [showCardForm, setShowCardForm] = useState(false);

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-8 md:mb-10">Billing</h1>

        {/* Credit Card Section */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="text-xs font-bold text-gray-900 tracking-wider">CREDIT CARD</h2>
            {!showCardForm && (
              <button 
                onClick={() => setShowCardForm(true)}
                className="text-[#1D6076] text-sm md:text-base font-medium border border-[#1D6076] px-4 py-2 md:px-6 md:py-2.5 rounded-lg hover:bg-[#1D6076]/5 transition-colors"
              >
                Add
              </button>
            )}
          </div>

          {!showCardForm ? (
            <div className="border border-gray-200 rounded-2xl p-5 md:p-6 flex items-center gap-3">
              <CreditCard size={20} className="text-gray-400 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-gray-500 text-sm md:text-base">No payment method selected</span>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl p-5 md:p-8">
              <h3 className="text-gray-900 text-base md:text-lg mb-6 md:mb-8">Card information</h3>

              <div className="space-y-4 md:space-y-5">
                {/* Card Number */}
                <div>
                  <label className="block text-sm md:text-base text-gray-700 mb-2">Card number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1D6076] focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-4 md:h-5" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 md:h-5" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-4 md:h-5" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Discover_Card_logo.svg" alt="Discover" className="h-4 md:h-5" />
                    </div>
                  </div>
                </div>

                {/* MM/YY and CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm md:text-base text-gray-700 mb-2">MM / YY</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1D6076] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base text-gray-700 mb-2">CVC</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="CVC"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1D6076] focus:border-transparent"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CreditCard size={16} className="text-gray-400 md:w-5 md:h-5" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="pt-4">
                  <h4 className="text-gray-900 text-base md:text-lg mb-4 md:mb-5">Billing address</h4>
                  
                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label className="block text-sm md:text-base text-gray-700 mb-2">Country or region</label>
                      <select className="w-full border border-gray-200 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1D6076] focus:border-transparent appearance-none bg-white">
                        <option>United States</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm md:text-base text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        placeholder="60016"
                        defaultValue="60016"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1D6076] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  By providing your card information, you allow Rinse to charge your card for future
                  payments in accordance with their terms.
                </p>

                {/* Submit Button */}
                <button className="w-full bg-[#EBA050] text-white py-4 md:py-5 rounded-xl font-medium text-base md:text-lg flex items-center justify-center gap-2 hover:bg-[#EBA050]/90 transition-colors">
                  Set up
                  <Lock size={16} className="md:w-5 md:h-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}