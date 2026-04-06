import Link from 'next/link';
import { ArrowLeft, Camera, Wrench, Wind, MapPin } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('tops');

  const categories = [
    { id: 'tops', label: 'Tops' },
    { id: 'bottoms', label: 'Bottoms' },
    { id: 'full-body', label: 'Full body' },
    { id: 'household', label: 'Household' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'buttons', label: 'Buttons' },
  ];

  const pricing = {
    tops: [
      { name: 'All Shirts', price: '5.95', icon: '👕' },
      { name: 'Polo', price: '5.95', icon: '👔' },
      { name: 'Blouse', price: '11.95', icon: '👚' },
      { name: 'Sweater', price: '15.95', icon: '🧥' },
      { name: 'Jacket/Blazer', price: '16.95', icon: '🧥' },
      { name: 'Vest', price: '15.95', icon: '🦺' },
    ],
    bottoms: [
      { name: 'Pants', price: '11.95', icon: '👖' },
      { name: 'Jeans', price: '11.95', icon: '👖' },
      { name: 'Shorts', price: '9.95', icon: '🩳' },
      { name: 'Skirt', price: '11.95', icon: '👗' },
    ],
    'full-body': [
      { name: 'Dress', price: '21.95', icon: '👗' },
      { name: 'Suit (2pc)', price: '24.95', icon: '🤵' },
      { name: 'Jumpsuit', price: '21.95', icon: '👘' },
    ],
    household: [
      { name: 'Comforter (Twin)', price: '29.95', icon: '🛏️' },
      { name: 'Comforter (Queen)', price: '39.95', icon: '🛏️' },
      { name: 'Bedspread', price: '35.95', icon: '🛏️' },
      { name: 'Blanket', price: '25.95', icon: '🧺' },
    ],
    accessories: [
      { name: 'Tie', price: '7.95', icon: '👔' },
      { name: 'Scarf', price: '11.95', icon: '🧣' },
      { name: 'Hat', price: '9.95', icon: '🎩' },
    ],
    buttons: [
      { name: 'Replace Button', price: '3.00', icon: '🔘' },
      { name: 'Repair Seam', price: '8.00', icon: '🪡' },
    ],
  };

  return (
    <div className="min-h-screen bg-white pb-32" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl text-gray-900 mb-8 md:mb-12">Services and Pricing</h1>

        {/* Services Icons */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16 max-w-2xl">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 overflow-hidden">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1768693602418-260d828b878d?w=400&h=400&fit=crop"
                alt="Wash & Fold"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm md:text-base text-gray-900 text-center">Wash & Fold</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-[#F5E6D3] rounded-2xl flex items-center justify-center mb-3 p-4">
              <svg viewBox="0 0 64 64" className="w-full h-full text-[#EBA050]" fill="currentColor">
                <rect x="20" y="10" width="24" height="44" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                <line x1="26" y1="16" x2="26" y2="48" stroke="currentColor" strokeWidth="2"/>
                <line x1="32" y1="16" x2="32" y2="48" stroke="currentColor" strokeWidth="2"/>
                <line x1="38" y1="16" x2="38" y2="48" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-sm md:text-base text-gray-900 text-center">Dry Cleaning</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-[#D9EEF0] rounded-2xl flex items-center justify-center mb-3 overflow-hidden">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1764117379170-705ca1e8d737?w=400&h=400&fit=crop"
                alt="Hang Dry"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm md:text-base text-gray-900 text-center">Hang Dry</span>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-6 md:mb-8">HOW IT WORKS</h2>
          
          <div className="space-y-6 md:space-y-8">
            <div className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center">
                <Camera size={24} className="text-gray-900 md:w-7 md:h-7" strokeWidth={1.5} />
              </div>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed pt-1.5 md:pt-2">
                We&apos;ll email you an itemized list with a photo of each item we receive.
              </p>
            </div>

            <div className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center">
                <Wrench size={24} className="text-gray-900 md:w-7 md:h-7" strokeWidth={1.5} />
              </div>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed pt-1.5 md:pt-2">
                We carefully inspect for stains and clean everything with expert care.
              </p>
            </div>

            <div className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center">
                <Wind size={24} className="text-gray-900 md:w-7 md:h-7" strokeWidth={1.5} />
              </div>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed pt-1.5 md:pt-2">
                We press and hang each of your items so they&apos;re ready to wear.
              </p>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-6 md:mb-8">PRICING</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Pricing List */}
          <div className="space-y-0 border-t border-gray-200">
            {pricing[activeCategory as keyof typeof pricing].map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-4 md:py-5 border-b border-gray-200"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-2xl md:text-3xl">{item.icon}</span>
                  <span className="text-gray-900 text-base md:text-lg">{item.name}</span>
                </div>
                <span className="text-gray-900 font-medium text-base md:text-lg">$ {item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT OUR FEES */}
        <div className="mb-8 max-w-3xl">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-6 md:mb-8">ABOUT OUR FEES</h2>
          
          <div className="space-y-6 md:space-y-8">
            {/* Service Fee */}
            <div>
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-gray-900 font-medium text-base md:text-lg">Service Fee</span>
                <span className="text-gray-900 font-medium text-base md:text-lg">$5.00</span>
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                We work hard to deliver exceptional service and quality. This fee enables us to maintain our standard and provide the best experience possible.
              </p>
            </div>

            {/* Pickup & Delivery Fee */}
            <div>
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-gray-900 font-medium text-base md:text-lg">Pickup & Delivery Fee</span>
                <span className="text-gray-900 font-medium text-base md:text-lg">$9.05</span>
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-3 md:mb-4">
                This covers the cost of picking up and delivering your clothes with Standard turnaround.
              </p>
              <button className="text-[#1D6076] text-sm md:text-base font-medium border border-[#1D6076] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#1D6076] hover:text-white transition-colors">
                Learn about standard turnaround days
              </button>
            </div>

            {/* Minimum Order */}
            <div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                All orders have a minimum order value of $30, excluding fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Pickup & Location */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-8 lg:px-12 py-4 md:py-5 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4 md:gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Pickup</div>
              <div className="text-sm md:text-base font-medium text-gray-900">Tonight</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Where</div>
              <div className="text-sm md:text-base font-medium text-gray-900 flex items-center gap-1">
                <MapPin size={14} className="text-gray-500 md:w-4 md:h-4" />
                1425 Elmwood St
              </div>
            </div>
          </div>
          <Link href="/schedule">
            <button className="w-14 h-14 md:w-16 md:h-16 bg-[#EBA050] rounded-full flex items-center justify-center hover:bg-[#EBA050]/90 transition-colors shadow-lg">
              <ArrowLeft size={24} className="text-white rotate-180 md:w-7 md:h-7" strokeWidth={2} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
