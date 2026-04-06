import { Bell } from 'lucide-react';
import Link from 'next/link';

interface NotificationBadgeProps {
  count?: number;
}

export function NotificationBadge({ count = 0 }: NotificationBadgeProps) {
  return (
    <Link href="/notifications" className="relative p-2">
      <div className="relative">
        <Bell size={24} className="text-white" strokeWidth={2.5} />
        {count > 0 && (
          <span 
            className="absolute -top-2 -right-2 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #c44569 0%, #e55d87 100%)'
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
    </Link>
  );
}