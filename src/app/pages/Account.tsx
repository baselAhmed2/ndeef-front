import { User, MapPin, Bell, CreditCard, Heart, HelpCircle, Settings, LogOut, ChevronRight, Star, Gift, Package } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';

const menuItems = [
  {
    section: 'Account',
    items: [
      { icon: User, label: 'Personal Information', color: '#1D6076' },
      { icon: MapPin, label: 'Saved Addresses', color: '#EBA050' },
      { icon: CreditCard, label: 'Payment Methods', color: '#2a7a94' },
    ],
  },
  {
    section: 'Preferences',
    items: [
      { icon: Heart, label: 'Favorites', color: '#d68b3a' },
      { icon: Bell, label: 'Notifications', color: '#1D6076' },
      { icon: Settings, label: 'Settings', color: '#5a6c7d' },
    ],
  },
  {
    section: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help & Support', color: '#2a7a94' },
      { icon: Star, label: 'Rate the App', color: '#EBA050' },
    ],
  },
];

export default function Account() {
  return (
    <div className="min-h-screen bg-[#f8fafb] pb-20">
      <TopBar title="Your Account" showSearch={false} />

      {/* Clean Profile Section */}
      <div className="relative px-5 pb-8 -mt-2 overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)'
      }}>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur-sm shadow-lg">
            <User size={40} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 text-white">
            <h2 className="font-bold text-2xl mb-1">Ahmed Mohamed</h2>
            <p className="text-sm text-white/80 font-normal mb-0.5">ahmed.mohamed@email.com</p>
            <p className="text-sm text-white/80 font-normal">+20 123 456 7890</p>
          </div>
        </div>
      </div>

      {/* Clean Stats Cards */}
      <div className="px-5 -mt-6 mb-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center bg-[#1D6076]/10">
                <Package size={22} className="text-[#1D6076]" strokeWidth={2} />
              </div>
              <p className="font-bold text-2xl mb-0.5 text-[#1D6076]">12</p>
              <p className="text-xs text-gray-600 font-normal">Completed</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center bg-[#EBA050]/10">
                <Star size={22} className="text-[#EBA050]" strokeWidth={2} />
              </div>
              <p className="font-bold text-2xl mb-0.5 text-[#EBA050]">450</p>
              <p className="text-xs text-gray-600 font-normal">Points</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center bg-[#2a7a94]/10">
                <MapPin size={22} className="text-[#2a7a94]" strokeWidth={2} />
              </div>
              <p className="font-bold text-2xl mb-0.5 text-[#2a7a94]">3</p>
              <p className="text-xs text-gray-600 font-normal">Addresses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Points Card */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#1D6076] to-[#2a7a94] text-white shadow-sm overflow-hidden relative">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift size={18} className="text-[#EBA050]" strokeWidth={2} />
                <p className="text-sm font-medium text-white/90">Current Points</p>
              </div>
              <h3 className="text-5xl font-bold mb-2">450</h3>
              <p className="text-sm text-white/80 font-normal">Redeem for discount on next order</p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#EBA050] shadow-lg">
              <Star size={32} className="text-white fill-white" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Clean Menu Sections */}
      <div className="px-5 space-y-4">
        {menuItems.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">{section.section}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    className="w-full flex items-center gap-3.5 p-4 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon size={20} style={{ color: item.color }} strokeWidth={2} />
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#1D6076] transition-colors" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Clean Logout Button */}
      <div className="px-5 mt-6 mb-4">
        <button className="w-full flex items-center justify-center gap-2.5 bg-white py-4 rounded-xl font-medium border-2 border-red-500 text-red-500 transition-all duration-200 shadow-sm hover:bg-red-50">
          <LogOut size={20} strokeWidth={2} />
          <span>Logout</span>
        </button>
      </div>

      {/* App Version */}
      <div className="px-5 pb-4 text-center">
        <p className="text-sm font-normal text-gray-500">
          Nadeef - Version 1.0.0
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
