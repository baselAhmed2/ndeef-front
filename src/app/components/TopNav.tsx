import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, User, LogOut, MapPin, HelpCircle, ChevronDown, Home, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Nadeef Logo ────────────────────────────────────────────────────────────────
function NadeefLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D6076] to-[#2a7a94] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5">
          <path d="M12 3C7.5 3 4 6.8 4 11.5C4 14.5 5.5 17.1 7.8 18.7L7 21l3-1.2c.6.2 1.3.2 2 .2 4.5 0 8-3.8 8-8.5C20 6.8 16.5 3 12 3z" fill="white" opacity="0.9" />
          <path d="M8.5 10.5c0-1.1.9-2 2-2s2 .9 2 2v3h-1.5v-2.5c0-.3-.2-.5-.5-.5s-.5.2-.5.5V13.5H8.5V10.5z" fill="#EBA050" />
          <circle cx="15" cy="11.5" r="1.5" fill="#EBA050" />
        </svg>
      </div>
      {!compact && (
        <span
          className="ndeef-topnav-brand tracking-tight"
          style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}
        >
          Nadeef
        </span>
      )}
    </Link>
  );
}

// ── TopNav ────────────────────────────────────────────────────────────────
export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const currentPath = pathname ?? "/";

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/nearby', label: 'Laundries', icon: MapPin },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  const visibleNavLinks = isLoggedIn
    ? navLinks
    : navLinks.filter(link => link.href !== '/orders');
  const authHref = (path: '/login' | '/signup') => `${path}?from=${encodeURIComponent(currentPath)}`;

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(`${href}/`);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim() || "N";
  const displayName = user?.firstName || user?.name || "Account";

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    router.push('/');
  };

  return (
    <>
      <header
        className="ndeef-topnav-shell fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 h-[64px] flex items-center justify-between gap-3 lg:gap-5">
          {/* Logo */}
          <NadeefLogo />

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
            {visibleNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3.5 lg:px-4 py-2 rounded-xl text-[15px] font-medium transition-all ${isActive(href)
                    ? 'ndeef-topnav-link-active bg-[#1D6076]/10 dark:bg-[#1D6076]/25'
                    : 'ndeef-topnav-link hover:bg-gray-50 dark:hover:bg-white/8'
                  }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(v => !v)}
                  className="ndeef-topnav-user flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 transition-all dark:bg-white/6 dark:hover:bg-white/10 dark:border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1D6076] to-[#2a7a94] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {initials}
                    </span>
                  </div>
                  <span className="ndeef-topnav-account-name text-sm font-medium hidden sm:block">{displayName}</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform dark:text-slate-400 ${userMenu ? 'rotate-180' : ''}`} strokeWidth={2} />
                </button>

                {userMenu && (
                  <div className="ndeef-topnav-menu absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="ndeef-topnav-menu-name text-sm font-medium">{user.name}</p>
                      <p className="ndeef-topnav-menu-email text-xs truncate">{user.email}</p>
                    </div>
                    {[
                      { href: '/profile', label: 'My Profile', Icon: User },
                      { href: '/wallet', label: 'Wallet', Icon: Wallet },
                    ].map(({ href, label, Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setUserMenu(false)}
                        className="ndeef-topnav-menu-link flex items-center gap-3 px-4 py-2.5 transition-colors"
                      >
                        <Icon size={15} className="ndeef-topnav-menu-icon" strokeWidth={2} />
                        <span className="ndeef-topnav-menu-text text-sm">{label}</span>
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={15} className="text-red-400" strokeWidth={2} />
                        <span className="text-sm text-red-500">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={authHref('/login')}
                  className="ndeef-topnav-link hidden sm:block text-[15px] font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all dark:hover:bg-white/8"
                >
                  Sign In
                </Link>
                <Link
                  href={authHref('/signup')}
                  className="bg-[#1D6076] text-white text-[15px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2a7a94] transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-all dark:hover:bg-white/8"
            >
              <Menu size={22} className="text-gray-700 dark:text-slate-200" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col dark:bg-[#091522]">
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-white/10">
              <NadeefLogo />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/8">
                <X size={20} className="text-gray-600 dark:text-slate-300" strokeWidth={2} />
              </button>
            </div>

            {isLoggedIn && user && (
              <div className="px-5 py-4 bg-[#1D6076]/5 border-b border-gray-100 dark:bg-[#1D6076]/12 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D6076] to-[#2a7a94] flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {visibleNavLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${isActive(href)
                      ? 'bg-[#1D6076] text-white dark:bg-[#1D6076]/85'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/8'
                    }`}
                >
                  <Icon size={18} strokeWidth={2} />
                  {label}
                </Link>
              ))}
              {isLoggedIn && (
                <>
                  {[
                    { href: '/profile', label: 'Profile' },
                    { href: '/wallet', label: 'Wallet' },
                    { href: '/preferences', label: 'Preferences' },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all dark:text-slate-200 dark:hover:bg-white/8"
                    >
                      {label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="px-4 py-5 border-t border-gray-100 space-y-2 dark:border-white/10">
              {isLoggedIn ? (
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-all"
                >
                  <LogOut size={16} strokeWidth={2} />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link href={authHref('/login')} onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3.5 rounded-xl border border-[#1D6076] text-[#1D6076] text-sm font-medium hover:bg-[#1D6076]/5 transition-all dark:border-[#3b87a2] dark:text-[#d5edf6] dark:hover:bg-[#1D6076]/18"
                  >
                    Sign In
                  </Link>
                  <Link href={authHref('/signup')} onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3.5 rounded-xl bg-[#1D6076] text-white text-sm font-medium hover:bg-[#2a7a94] transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer so content starts below fixed nav */}
      <div className="h-[64px]" />
    </>
  );
}
