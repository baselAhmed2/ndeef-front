"use client";

import { Home, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname() ?? '/';
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 shadow-sm">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all duration-200"
            >
              {isActive && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[#1D6076]"
                />
              )}
              <Icon 
                size={22} 
                className={`transition-colors duration-200 ${
                  isActive ? 'text-[#1D6076]' : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isActive ? 'text-[#1D6076]' : 'text-gray-500'
              }`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
