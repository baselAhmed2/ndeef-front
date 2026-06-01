"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';
import { apiRequest } from '../lib/admin-api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface TopBarProps {
  showSearch?: boolean;
  title?: string;
}

// Exponential back-off when the server returns 429
const MIN_INTERVAL_MS = 30_000;  // 30 s normal polling
const MAX_BACKOFF_MS  = 300_000; // 5 min max back-off

export function TopBar({ showSearch = true, title }: TopBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const backoffMsRef = useRef(MIN_INTERVAL_MS);
  const backoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback — no new identity on every render
  const fetchCount = useCallback(async () => {
    if (!pollingEnabled) return;
    try {
      const response = await apiRequest<{ unreadCount?: number; UnreadCount?: number }>('/notifications/count');
      setUnreadCount(Number(response.unreadCount ?? response.UnreadCount ?? 0));
      // Reset backoff on success
      backoffMsRef.current = MIN_INTERVAL_MS;
    } catch (error: unknown) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: number }).status)
          : null;

      if (status === 429) {
        // Pause polling and schedule resume with exponential back-off
        setPollingEnabled(false);
        backoffMsRef.current = Math.min(backoffMsRef.current * 2, MAX_BACKOFF_MS);
        backoffTimerRef.current = setTimeout(() => {
          setPollingEnabled(true);
        }, backoffMsRef.current);
      }
      // For other errors just keep the last known count
    }
  }, [pollingEnabled]);

  // Initial load
  useEffect(() => {
    void fetchCount();
    return () => {
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAutoRefresh(fetchCount, {
    enabled: pollingEnabled,
    intervalMs: MIN_INTERVAL_MS,
  });

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
            <NotificationBadge count={unreadCount} />
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
              <NotificationBadge count={unreadCount} />
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
