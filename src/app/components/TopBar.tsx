import { MapPin, Search } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';

interface TopBarProps {
  showSearch?: boolean;
  title?: string;
}

export function TopBar({ showSearch = true, title }: TopBarProps) {
  return (
    <div className="relative">
      {/* Clean Teal Background */}
      <div 
        className="text-white p-5 pt-8" 
        style={{
          background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)'
        }}
      >
        {title ? (
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-xl tracking-tight">{title}</h1>
            <NotificationBadge count={2} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Delivery to</p>
                  <p className="text-xs text-white/70 font-normal">Home - University Street</p>
                </div>
              </div>
              <NotificationBadge count={2} />
            </div>
            
            {showSearch && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for laundries..."
                  className="w-full bg-white text-gray-800 rounded-xl px-5 py-3.5 pl-12 shadow-sm border border-gray-100 placeholder:text-gray-400 font-normal focus:outline-none focus:ring-2 focus:ring-[#1D6076]/30 transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Subtle Accent Line */}
      <div className="h-0.5 bg-[#EBA050]/20" />
    </div>
  );
}