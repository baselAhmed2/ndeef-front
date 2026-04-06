import Link from 'next/link';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function Refer() {
  const referralCode = "BASEL20";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    // You can add a toast notification here
  };

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        {/* Hero Image */}
        <div className="mb-8 md:mb-12 rounded-3xl overflow-hidden">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1603306008742-521e80bfabe6?w=800&h=500&fit=crop"
            alt="Refer friends"
            className="w-full h-64 md:h-80 object-cover"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl text-gray-900 mb-4 md:mb-6">
          Give $20, Get $20
        </h1>
        
        <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8 md:mb-12">
          Share the gift of Rinse with your friends and family. For every friend who signs up and completes their first order, you&apos;ll both get $20 in credit.
        </p>

        {/* How it works */}
        <div className="mb-10 md:mb-14">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-6 md:mb-8">HOW IT WORKS</h2>
          
          <div className="space-y-6 md:space-y-8">
            <div className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#EBA050] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">1</span>
              </div>
              <div className="flex-1 pt-1.5 md:pt-2">
                <h3 className="text-gray-900 font-medium text-base md:text-lg mb-1">Share your code</h3>
                <p className="text-gray-600 text-sm md:text-base">Send your unique referral code to friends and family.</p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#EBA050] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">2</span>
              </div>
              <div className="flex-1 pt-1.5 md:pt-2">
                <h3 className="text-gray-900 font-medium text-base md:text-lg mb-1">They sign up</h3>
                <p className="text-gray-600 text-sm md:text-base">Your friend creates an account and uses your code.</p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#EBA050] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">3</span>
              </div>
              <div className="flex-1 pt-1.5 md:pt-2">
                <h3 className="text-gray-900 font-medium text-base md:text-lg mb-1">You both get $20</h3>
                <p className="text-gray-600 text-sm md:text-base">Once they complete their first order, you both receive $20 credit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-6 md:p-8 mb-6">
          <h3 className="text-gray-900 font-medium text-base md:text-lg mb-4">Your referral code</h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-xl px-4 py-4 md:px-6 md:py-5 border border-gray-200">
              <p className="text-2xl md:text-3xl font-bold text-[#EBA050] text-center tracking-wider">
                {referralCode}
              </p>
            </div>
            <button 
              onClick={copyToClipboard}
              className="bg-[#EBA050] text-white px-6 md:px-8 rounded-xl hover:bg-[#EBA050]/90 transition-colors flex items-center gap-2"
            >
              <Copy size={20} className="md:w-6 md:h-6" strokeWidth={2} />
              <span className="hidden md:inline font-medium">Copy</span>
            </button>
          </div>
        </div>

        {/* Share Button */}
        <button className="w-full bg-[#1D6076] text-white py-4 md:py-5 rounded-xl font-medium text-base md:text-lg flex items-center justify-center gap-2 hover:bg-[#1D6076]/90 transition-colors shadow-lg mb-8">
          <Share2 size={20} className="md:w-6 md:h-6" strokeWidth={2} />
          Share with friends
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center">
            <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-gray-600 text-sm md:text-base">Successful referrals</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center">
            <p className="text-3xl md:text-4xl font-bold text-[#EBA050] mb-2">$0</p>
            <p className="text-gray-600 text-sm md:text-base">Earned in credits</p>
          </div>
        </div>

        {/* Terms */}
        <div className="text-center text-gray-500 text-xs md:text-sm">
          <p>Terms and conditions apply. Credits expire 1 year from issue date.</p>
        </div>
      </div>
    </div>
  );
}
