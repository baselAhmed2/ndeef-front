import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, Zap, DollarSign, Package, CreditCard, BarChart3 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function RinseRepeat() {
  const router = useRouter();

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
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-6 md:mb-8">What&apos;s Rinse Repeat?</h1>

        {/* Image */}
        <div className="mb-5 md:mb-6 rounded-2xl overflow-hidden">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1553272725-086100aecf5e?w=800&h=400&fit=crop"
            alt="Rinse Repeat bag"
            className="w-full h-48 md:h-64 object-cover"
          />
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4 md:mb-5">
          Our all-inclusive Wash & Fold subscription. Priced by the bag, not by the pound, with savings of up to 60% vs. Pay-As-You-Go.
        </p>

        {/* Price Box */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 md:p-5 mb-6 md:mb-8">
          <p className="text-[#EBA050] text-base md:text-lg font-medium flex items-center gap-2">
            <span className="text-xl md:text-2xl">$</span>
            <span>Starting as low as $59.00 / bag</span>
          </p>
        </div>

        {/* Features */}
        <h2 className="text-gray-900 text-base md:text-lg font-medium mb-5 md:mb-6">All Rinse Repeat plans include:</h2>
        
        <div className="space-y-4 md:space-y-5 mb-8 md:mb-10">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
              <Truck size={24} className="text-[#1D9B9B] md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 text-sm md:text-base pt-1.5 md:pt-2">
              Always free pickup & delivery
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
              <Zap size={24} className="text-[#1D9B9B] md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 text-sm md:text-base pt-1.5 md:pt-2">
              Free Next-Day Rush Service
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
              <DollarSign size={24} className="text-[#1D9B9B] md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 text-sm md:text-base pt-1.5 md:pt-2">
              Waived Service Fee on all orders
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
              <Package size={24} className="text-[#1D9B9B] md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 text-sm md:text-base pt-1.5 md:pt-2">
              Unlimited rollover of bags and pounds
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
              <CreditCard size={24} className="text-[#1D9B9B] md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 text-sm md:text-base pt-1.5 md:pt-2">
              $10.00 in monthly credit for other services
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
              <BarChart3 size={24} className="text-[#1D9B9B] md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 text-sm md:text-base pt-1.5 md:pt-2">
              Modify, pause, or cancel your Rinse Repeat subscription anytime.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link href="/rinse-repeat/plan">
          <button className="w-full bg-[#EBA050] text-white py-4 md:py-5 rounded-xl font-medium text-base md:text-lg hover:bg-[#EBA050]/90 transition-colors shadow-lg">
            Get started with Rinse Repeat
          </button>
        </Link>
      </div>
    </div>
  );
}
