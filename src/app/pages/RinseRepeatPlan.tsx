import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

export default function RinseRepeatPlan() {
  const router = useRouter();
  const [selectedBags, setSelectedBags] = useState<1 | 2 | 4>(2);

  const bagOptions = [
    { 
      bags: 1, 
      pricePerBag: 75, 
      monthlyTotal: 75, 
      label: "Ideal for one person's needs",
      icon: 1
    },
    { 
      bags: 2, 
      pricePerBag: 72, 
      monthlyTotal: 144, 
      label: "Perfect for couples", 
      popular: true,
      icon: 2
    },
    { 
      bags: 4, 
      pricePerBag: 70, 
      monthlyTotal: 280, 
      label: "Great for families",
      icon: 4
    },
  ];

  const selectedOption = bagOptions.find(opt => opt.bags === selectedBags);

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 md:px-8 lg:px-12 py-4 z-10">
        <button onClick={() => router.back()} className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 pb-8 md:pb-12">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-3 md:mb-4">Your Rinse Repeat plan</h1>
        <p className="text-gray-500 text-sm md:text-base mb-8 md:mb-10 leading-relaxed">
          Let us know how many bags you need each month (pro-tip: it should be equal to the number of times you do laundry each month!)
        </p>

        {/* Your Monthly Bags */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">YOUR MONTHLY BAGS</h2>
          
          <div className="space-y-3 md:space-y-4">
            {bagOptions.map((option) => (
              <button
                key={option.bags}
                onClick={() => setSelectedBags(option.bags as 1 | 2 | 4)}
                className={`w-full text-left rounded-2xl p-5 md:p-6 transition-all ${
                  selectedBags === option.bags
                    ? 'border-2 border-[#EBA050] bg-white'
                    : 'border border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Bag Icons */}
                    <div className="flex items-center gap-1">
                      {[...Array(option.icon)].map((_, i) => (
                        <ShoppingBag key={i} size={20} className="text-gray-600 md:w-6 md:h-6" strokeWidth={1.5} />
                      ))}
                    </div>
                  </div>
                  {option.popular && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-full">
                      <ShoppingBag size={14} className="text-[#EBA050] md:w-4 md:h-4" strokeWidth={2} />
                      <span className="text-[#EBA050] text-xs md:text-sm font-medium">Most popular</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-900 font-semibold text-xl md:text-2xl mb-1">
                      {option.bags} {option.bags === 1 ? 'bag' : 'bags'}
                    </p>
                    <p className="text-gray-500 text-sm md:text-base">{option.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold text-lg md:text-xl">
                      ${option.pricePerBag} / bag
                    </p>
                    <p className="text-gray-500 text-sm md:text-base">
                      ${option.monthlyTotal} / month
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Annual Billing Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 md:p-5 mb-8 md:mb-10 flex items-start gap-3">
          <div className="w-6 h-6 shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#EBA050]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <p className="text-gray-700 text-sm md:text-base">
            Save additional 15% with annual billing
          </p>
        </div>

        {/* Payment Method */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">PAYMENT METHOD</h2>
          
          {/* Selected Plan Summary */}
          <div className="border border-gray-200 rounded-2xl p-5 md:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#EBA050] font-bold text-sm md:text-base tracking-wide">RINSE REPEAT</span>
            </div>
            <p className="text-gray-500 text-xs md:text-sm mb-4">Monthly subscription</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-900 font-medium text-base md:text-lg">
                {selectedOption?.bags} {selectedOption?.bags === 1 ? 'bag' : 'bags'} / month
              </span>
              <span className="text-gray-900 font-semibold text-lg md:text-xl">
                ${selectedOption?.monthlyTotal} / month
              </span>
            </div>
          </div>

          {/* No Payment Method */}
          <div className="border border-gray-200 rounded-2xl p-5 md:p-6 flex items-center gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <span className="text-gray-500 text-sm md:text-base">No payment method selected</span>
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full bg-[#EBA050] text-white py-4 md:py-5 rounded-xl font-medium text-base md:text-lg hover:bg-[#EBA050]/90 transition-colors shadow-lg">
          Add payment method
        </button>
      </div>
    </div>
  );
}
