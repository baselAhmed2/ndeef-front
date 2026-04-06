import Link from 'next/link';
import { X, User, Tag, Package, Sliders, CreditCard, Clock, HelpCircle, Gift, ThumbsUp, LogOut, Home } from 'lucide-react';

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose }: SideMenuProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed inset-y-0 left-0 w-80 md:w-96 bg-white z-50 shadow-xl overflow-y-auto" dir="ltr">
        <div className="p-5 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl text-gray-900">Hi, Basel</h2>
            <button onClick={onClose} className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={24} className="text-gray-400 md:w-7 md:h-7" strokeWidth={2} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="space-y-1 mb-8 md:mb-10">
            <Link href="/" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Home size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Home</span>
            </Link>

            <Link href="/profile" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <User size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Profile</span>
            </Link>

            <Link href="/services" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Tag size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Services and Pricing</span>
            </Link>

            <Link href="/rinse-repeat" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Package size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Rinse Repeat</span>
            </Link>

            <Link href="/preferences" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Sliders size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Preferences</span>
            </Link>

            <Link href="/billing" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <CreditCard size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Billing</span>
            </Link>

            <Link href="/order-history" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Clock size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Order History</span>
            </Link>

            <Link href="/help" onClick={onClose} className="flex items-center gap-4 px-3 py-4 md:py-5 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <HelpCircle size={20} className="text-gray-700 md:w-6 md:h-6" strokeWidth={2} />
              <span className="text-base md:text-lg">Help</span>
            </Link>
          </div>

          {/* Share Button */}
          <button className="w-full bg-[#1D6076] text-white py-4 md:py-5 rounded-xl flex items-center justify-center gap-2 mb-4 md:mb-6 hover:bg-[#1D6076]/90 transition-colors">
            <Gift size={20} className="md:w-6 md:h-6" strokeWidth={2} />
            <span className="font-medium text-sm md:text-base">Share Rinse: Give $20, Get $20</span>
          </button>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-gray-200">
            <button className="flex items-center gap-2 text-[#1D6076] hover:text-[#1D6076]/80 transition-colors">
              <ThumbsUp size={18} className="md:w-5 md:h-5" strokeWidth={2} />
              <span className="text-sm md:text-base font-medium">Give us feedback</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <span className="text-sm md:text-base">Log out</span>
              <LogOut size={18} className="md:w-5 md:h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}